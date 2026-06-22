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

    if (needsMediaWorker(sourceType)) {
      await routeToMedia(supabase, item.id);
      return jsonResponse({ itemId: item.id, route: "media", sourceType });
    }

    // Percorso LEGGERO: estrai raw_content inline.
    const result = await extractRawContent(supabase, sourceType, item);

    if (result.route === "media") {
      // youtube senza transcript → percorso media (§6.1).
      await routeToMedia(supabase, item.id);
      return jsonResponse({ itemId: item.id, route: "media", sourceType });
    }

    // Salva il raw_content (+ eventuale errore di estrazione non bloccante) e
    // chiama generate: anche con contenuto parziale + nota il riassunto è utile.
    await supabase
      .from("items")
      .update({ raw_content: result.rawContent, error: result.error ?? null })
      .eq("id", item.id);
    await invokeFunction("generate", { itemId: item.id });

    return jsonResponse({ itemId: item.id, route: "light", sourceType });
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

/** True per i tipi che richiedono il worker media (download + STT). */
function needsMediaWorker(sourceType: SourceType): boolean {
  // 'youtube' è nel percorso leggero, con fallback a media se manca il transcript.
  return sourceType === "reel" || sourceType === "tiktok";
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
  | { route: "light"; rawContent: string; error?: string }
  | { route: "media" };

/**
 * Estrae il raw_content per il percorso leggero. Ritorna route='media' solo per
 * lo YouTube senza transcript. In caso di estrazione fallita ritorna comunque
 * route='light' con un messaggio in `error`: l'item NON sparisce e generate gira
 * sulla sola nota.
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
      // Niente transcript pubblico → il worker estrarrà l'audio (§6.1).
      return transcript ? { route: "light", rawContent: transcript } : { route: "media" };
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
