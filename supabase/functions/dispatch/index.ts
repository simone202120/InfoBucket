// dispatch — Edge Function (spec §6.1).
//
// SCAFFOLD (Fase 2). Riceve l'id di un item, determina il source_type e instrada:
//   - percorso LEGGERO  (article / document / youtube-con-transcript):
//       estrae raw_content inline, poi chiama `generate`.
//   - percorso MEDIA    (reel / tiktok / youtube-senza-transcript):
//       imposta media_stage = 'pending' e termina (ci pensa il worker, §7).
//
// L'estrazione vera (articolo/documento/transcript) è lasciata a stub Fase 2:
// la struttura — auth, validazione input, instradamento, errori, CORS — è completa.

import { createServiceClient } from "../_shared/supabase.ts";
import { detectSourceType, type SourceType } from "../_shared/source-type.ts";
import {
  errorResponse,
  jsonResponse,
  preflightResponse,
} from "../_shared/cors.ts";

interface DispatchRequest {
  itemId: string;
}

interface ItemRow {
  id: string;
  source_url: string | null;
  storage_path: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflightResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  // --- Validazione input esterno -------------------------------------------
  let body: DispatchRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Body JSON non valido", 400);
  }
  const itemId = body?.itemId;
  if (typeof itemId !== "string" || !UUID_RE.test(itemId)) {
    return errorResponse("itemId mancante o non valido", 400);
  }

  try {
    const supabase = createServiceClient();

    // --- Carica l'item ------------------------------------------------------
    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("id, source_url, storage_path")
      .eq("id", itemId)
      .single<ItemRow>();

    if (fetchError || !item) {
      return errorResponse("Item non trovato", 404, fetchError);
    }

    // --- Determina source_type (logica condivisa, spec §6.1) ---------------
    const sourceType = detectSourceType({
      url: item.source_url,
      storagePath: item.storage_path,
    });

    // Persiste il tipo rilevato (utile a UI e worker).
    await supabase.from("items").update({ source_type: sourceType }).eq("id", item.id);

    // --- Instradamento ------------------------------------------------------
    if (needsMediaWorker(sourceType)) {
      // Percorso MEDIA: la coda è (media_stage='pending'). Il worker la consuma.
      const { error } = await supabase
        .from("items")
        .update({ media_stage: "pending" })
        .eq("id", item.id);
      if (error) return errorResponse("Aggiornamento coda media fallito", 500, error);

      return jsonResponse({ itemId: item.id, route: "media", sourceType });
    }

    // Percorso LEGGERO: estrai raw_content inline, poi chiama `generate`.
    const rawContent = await extractRawContent(sourceType, item);

    if (rawContent === MEDIA_FALLBACK) {
      // Caso youtube senza transcript: degrada al percorso media (spec §6.1).
      await supabase.from("items").update({ media_stage: "pending" }).eq("id", item.id);
      return jsonResponse({ itemId: item.id, route: "media", sourceType });
    }

    await supabase.from("items").update({ raw_content: rawContent }).eq("id", item.id);
    await invokeGenerate(item.id);

    return jsonResponse({ itemId: item.id, route: "light", sourceType });
  } catch (e) {
    return errorResponse("Errore interno dispatch", 500, e);
  }
});

/** True per i tipi che richiedono il worker media (download + STT). */
function needsMediaWorker(sourceType: SourceType): boolean {
  return sourceType === "reel" || sourceType === "tiktok";
  // NB: 'youtube' è gestito nel percorso leggero, con fallback a media se manca
  //     il transcript (vedi extractRawContent).
}

/** Sentinella: l'estrazione leggera ha capito che serve il worker media. */
const MEDIA_FALLBACK = Symbol("media-fallback");

/**
 * Estrae il raw_content per il percorso leggero.
 * TODO Fase 2: implementare estrazione reale.
 */
async function extractRawContent(
  sourceType: SourceType,
  item: ItemRow,
): Promise<string | typeof MEDIA_FALLBACK> {
  switch (sourceType) {
    case "article":
      // TODO Fase 2: fetch pagina + estrazione testo leggibile (readability/HTML→testo).
      void item;
      return "";
    case "document":
      // TODO Fase 2: scarica il file da Storage (storage_path) ed estrai il testo (PDF, ecc.).
      return "";
    case "youtube":
      // TODO Fase 2: prova a recuperare il transcript pubblico.
      //   se presente → ritorna il testo; se assente → return MEDIA_FALLBACK.
      return MEDIA_FALLBACK;
    default:
      // 'other': nessuna fonte da scaricare; resta solo la nota utente.
      return "";
  }
}

/**
 * Invoca la Edge Function `generate` per l'item.
 * TODO Fase 2: implementare l'invocazione effettiva (functions.invoke / fetch
 *   verso l'endpoint generate con auth service-role).
 */
async function invokeGenerate(itemId: string): Promise<void> {
  // Placeholder: l'orchestrazione completa arriva con `generate` in Fase 2.
  console.info("invokeGenerate (stub)", itemId);
}
