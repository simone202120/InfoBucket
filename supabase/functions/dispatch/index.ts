// dispatch — Edge Function (spec §6.1). Instradamento delle fonti.
//
// Riceve l'id di un item, determina il source_type e instrada:
//   - percorso LEGGERO (article / document / youtube-con-transcript):
//       estrae raw_content INLINE, lo salva, poi chiama `generate`.
//   - percorso MEDIA (reel / tiktok / youtube-senza-transcript):
//       imposta media_stage='pending' e termina (ci pensa il worker, §7).
//
// Tutte le fonti remote sono NON fidate: l'estrazione usa fetch con timeout/limiti
// (_shared/fetch-remote.ts). Gli errori non fanno sparire l'item: si salva `error`
// e si chiama comunque `generate` (caption/nota possono bastare), oppure si lascia
// l'item 'processing' (lo sweep pg_cron ritenta) se l'errore è transitorio.

import { createServiceClient } from "../_shared/supabase.ts";
import { detectSourceType, type SourceType } from "../_shared/source-type.ts";
import { extractArticle } from "../_shared/extract-article.ts";
import { extractDocument } from "../_shared/extract-document.ts";
import { fetchYoutubeTranscript } from "../_shared/youtube-transcript.ts";
import { fetchText } from "../_shared/fetch-remote.ts";
import { composeCaptionRawContent, fetchLightCaption } from "../_shared/caption.ts";
import { invokeFunction } from "../_shared/invoke.ts";
import { errorResponse, jsonResponse, preflightResponse } from "../_shared/cors.ts";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Bucket di Storage per i documenti caricati. L'upload dei documenti arriva con
// le fasi successive: questo è il nome di bucket atteso (creane uno 'documents'
// privato nel dashboard Storage; va mantenuto in sync col client quando esisterà).
const DOCUMENTS_BUCKET = "documents";

interface ItemRow {
  id: string;
  source_url: string | null;
  storage_path: string | null;
  file_type: string | null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflightResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Body JSON non valido", 400);
  }
  const itemId = readItemId(body);
  if (!itemId) return errorResponse("itemId mancante o non valido", 400);

  try {
    const supabase = createServiceClient();

    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("id, source_url, storage_path, file_type")
      .eq("id", itemId)
      .single<ItemRow>();
    if (fetchError || !item) {
      return errorResponse("Item non trovato", 404, fetchError);
    }

    const sourceType = detectSourceType({
      url: item.source_url,
      storagePath: item.storage_path,
    });
    // Persiste il tipo rilevato (utile a UI e worker).
    await supabase.from("items").update({ source_type: sourceType }).eq("id", item.id);

    // Percorso LEGGERO per TUTTE le fonti: estrai inline ciò che è disponibile
    // senza il worker. Per tiktok/reel è la caption (oEmbed/Open Graph, pubblica e
    // senza login): così l'utente ha SUBITO un riassunto, e la trascrizione audio
    // resta un arricchimento opzionale del worker (`queueMedia`). Solo lo youtube
    // senza transcript pubblico non ha nulla di leggero → va dritto al worker.
    const result = await extractRawContent(supabase, sourceType, item);

    if (result.route === "media") {
      await routeToMedia(supabase, item.id);
      return jsonResponse({ itemId: item.id, route: "media", sourceType });
    }

    // Salva il raw_content (+ eventuale errore non bloccante); se la fonte ha anche
    // un media da trascrivere, la accoda al worker (media_stage='pending') nello
    // stesso update. Poi chiama generate: anche con la sola caption + nota il
    // riassunto è utile, ed è disponibile in pochi secondi.
    const patch: Record<string, unknown> = {
      raw_content: result.rawContent,
      error: result.error ?? null,
    };
    if (result.queueMedia) patch.media_stage = "pending";
    await supabase.from("items").update(patch).eq("id", item.id);
    await invokeFunction("generate", { itemId: item.id });

    return jsonResponse({
      itemId: item.id,
      route: "light",
      sourceType,
      queuedMedia: result.queueMedia ?? false,
    });
  } catch (e) {
    // Errore non gestito: l'item resta 'processing' e lo sweep pg_cron ritenta.
    return errorResponse("Errore interno dispatch", 500, e);
  }
});

/** Estrae itemId dal body, accettando sia `itemId` (camelCase) sia `item_id`. */
function readItemId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  const raw = obj["itemId"] ?? obj["item_id"];
  return typeof raw === "string" && UUID_RE.test(raw) ? raw : null;
}

/** Mette l'item in coda per il worker media. */
async function routeToMedia(supabase: SupabaseClient, itemId: string): Promise<void> {
  const { error } = await supabase
    .from("items")
    .update({ media_stage: "pending" })
    .eq("id", itemId);
  if (error) throw new Error(`Accodamento media fallito: ${error.message}`);
}

type ExtractResult =
  | { route: "light"; rawContent: string; error?: string; queueMedia?: boolean }
  | { route: "media" };

/**
 * Estrae il raw_content per il percorso leggero. Ritorna route='media' solo per
 * lo YouTube senza transcript. Per tiktok/reel estrae la caption e segnala
 * `queueMedia` (il worker aggiungerà la trascrizione). In caso di estrazione
 * fallita ritorna comunque route='light' con un messaggio in `error`: l'item NON
 * sparisce e generate gira sulla sola nota.
 */
async function extractRawContent(
  supabase: SupabaseClient,
  sourceType: SourceType,
  item: ItemRow,
): Promise<ExtractResult> {
  switch (sourceType) {
    case "article": {
      if (!item.source_url) return { route: "light", rawContent: "" };
      try {
        const html = await fetchText(item.source_url);
        const { text } = extractArticle(html, item.source_url);
        return { route: "light", rawContent: text };
      } catch {
        return {
          route: "light",
          rawContent: "",
          error: "Impossibile scaricare o leggere l'articolo.",
        };
      }
    }

    case "document": {
      if (!item.storage_path) {
        return { route: "light", rawContent: "", error: "Documento senza file." };
      }
      try {
        const bytes = await downloadDocument(supabase, item.storage_path);
        const extracted = await extractDocument(bytes, item.file_type, item.storage_path);
        return extracted.ok
          ? { route: "light", rawContent: extracted.text }
          : { route: "light", rawContent: "", error: extracted.reason };
      } catch {
        return {
          route: "light",
          rawContent: "",
          error: "Impossibile scaricare il documento dallo Storage.",
        };
      }
    }

    case "youtube": {
      if (!item.source_url) return { route: "media" };
      const transcript = await fetchYoutubeTranscript(item.source_url);
      // Transcript pubblico disponibile: è già il contenuto completo.
      if (transcript) return { route: "light", rawContent: transcript };
      // Niente transcript (gli IP cloud vengono spesso bloccati): prova la caption
      // oEmbed (titolo + canale) per dare un riassunto SUBITO — come tiktok/reel — e
      // accoda comunque l'audio al worker, che arricchirà con la trascrizione (§6.1).
      const meta = await fetchLightCaption("youtube", item.source_url, fetchText);
      const rawContent = composeCaptionRawContent(meta);
      if (rawContent) return { route: "light", rawContent, queueMedia: true };
      // Nemmeno la caption pubblica: lascia l'intera estrazione al worker.
      return { route: "media" };
    }

    case "tiktok":
    case "reel": {
      // Caption pubblica (oEmbed TikTok / Open Graph IG): riassunto immediato senza
      // worker né login. `queueMedia` accoda comunque l'audio per la trascrizione.
      if (!item.source_url) return { route: "light", rawContent: "", queueMedia: true };
      const meta = await fetchLightCaption(sourceType, item.source_url, fetchText);
      return {
        route: "light",
        rawContent: composeCaptionRawContent(meta),
        queueMedia: true,
      };
    }

    default:
      // 'other': nessuna fonte da scaricare; resta solo la nota utente.
      return { route: "light", rawContent: "" };
  }
}

/** Scarica i byte di un documento da Supabase Storage. */
async function downloadDocument(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(storagePath);
  if (error || !data) {
    throw new Error(`Download Storage fallito: ${error?.message ?? "nessun dato"}`);
  }
  return new Uint8Array(await data.arrayBuffer());
}
