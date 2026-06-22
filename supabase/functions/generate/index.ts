// generate — Edge Function (spec §6.2). Il cuore AI, CONDIVISO da tutte le fonti.
//
// SCAFFOLD (Fase 2). Riceve un item con raw_content già pronto e:
//   1. chiama OpenRouter (modello da OPENROUTER_MODEL) → summary + tags + bucket (JSON)
//   2. valida l'output del modello (NON fidato) con parseModelOutput
//   3. genera l'embedding via OpenAI text-embedding-3-small → vector(1536)
//   4. aggiorna l'item a status='ready'
//
// Errori che NON fanno sparire l'item (CLAUDE.md §4): qualunque fallimento
// salva `error` e lascia comunque l'item visibile in inbox (status='ready').
//
// La validazione dell'output del modello è una funzione PURA importata da
// _shared/model-output.ts (testata in _shared/model-output.test.ts).

import { createServiceClient, requireEnv } from "../_shared/supabase.ts";
import {
  parseModelOutput,
  type ModelOutput,
} from "../_shared/model-output.ts";
import {
  errorResponse,
  jsonResponse,
  preflightResponse,
} from "../_shared/cors.ts";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const EMBEDDING_MODEL = "text-embedding-3-small"; // → vector(1536)
const EMBEDDING_DIM = 1536;
const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface GenerateRequest {
  itemId: string;
}

interface ItemRow {
  id: string;
  raw_content: string | null;
  note: string | null;
  summary: string | null;
}

interface BucketRow {
  id: string;
  name: string;
  description: string | null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflightResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Body JSON non valido", 400);
  }
  const itemId = body?.itemId;
  if (typeof itemId !== "string" || !UUID_RE.test(itemId)) {
    return errorResponse("itemId mancante o non valido", 400);
  }

  const supabase = createServiceClient();

  // Carica l'item e i bucket esistenti (servono al prompt per il matching).
  const { data: item, error: fetchError } = await supabase
    .from("items")
    .select("id, raw_content, note, summary")
    .eq("id", itemId)
    .single<ItemRow>();
  if (fetchError || !item) {
    return errorResponse("Item non trovato", 404, fetchError);
  }

  const { data: buckets } = await supabase
    .from("buckets")
    .select("id, name, description");

  try {
    // 1. Generazione (OpenRouter) → testo JSON non fidato.
    const rawModelText = await callOpenRouter(item, buckets ?? []);

    // 2. Validazione dell'output del modello (funzione pura).
    const parsed = parseModelOutput(rawModelText);
    if (!parsed.ok) {
      // Output non valido: non perdiamo l'item, lo segnaliamo in inbox.
      await updateItem(supabase, item.id, {
        status: "ready",
        processed_at: new Date().toISOString(),
        error: `Output AI non valido: ${parsed.error}`,
      });
      return jsonResponse({ itemId: item.id, status: "ready", warning: parsed.error });
    }
    const output: ModelOutput = parsed.value;

    // 3. Embedding (OpenAI). Sorgente: summary + raw_content + note (spec §6.2).
    const embeddingInput = [output.summary, item.raw_content, item.note]
      .filter((s): s is string => !!s && s.trim() !== "")
      .join("\n");
    const embedding = assertEmbeddingDim(await embed(embeddingInput));

    // 4. Aggiorna l'item a 'ready' con i campi prodotti.
    await updateItem(supabase, item.id, {
      summary: output.summary,
      tags: output.tags,
      suggested_bucket_id:
        output.bucket.match === "existing" ? output.bucket.existingId : null,
      suggested_bucket_name:
        output.bucket.match === "new" ? output.bucket.newName : null,
      embedding,
      status: "ready",
      processed_at: new Date().toISOString(),
      error: null,
    });

    return jsonResponse({ itemId: item.id, status: "ready" });
  } catch (e) {
    // Errore che non fa sparire l'item: resta in inbox con un messaggio.
    const message = e instanceof Error ? e.message : "errore di elaborazione";
    await updateItem(supabase, item.id, {
      status: "ready",
      processed_at: new Date().toISOString(),
      error: message,
    }).catch(() => {/* best-effort: non sovrascrivere l'errore originale */});
    return errorResponse("Generazione fallita", 500, e);
  }
});

/**
 * Chiama OpenRouter (chat/completion) e ritorna il TESTO grezzo della risposta
 * del modello (atteso JSON, validato a valle).
 * TODO Fase 2: costruire il prompt completo (raw_content + note + elenco bucket
 *   con id/name/description) e parametri (response_format json, temperatura, ecc.).
 */
async function callOpenRouter(item: ItemRow, buckets: BucketRow[]): Promise<string> {
  const apiKey = requireEnv("OPENROUTER_API_KEY");
  const model = Deno.env.get("OPENROUTER_MODEL") ?? DEFAULT_OPENROUTER_MODEL;

  // TODO Fase 2: comporre messages = [system, user(raw_content, note, buckets)].
  void item;
  void buckets;
  void apiKey;
  void model;

  throw new Error("callOpenRouter non implementata (TODO Fase 2)");
}

/**
 * Genera l'embedding via OpenAI text-embedding-3-small (vector(1536)).
 * TODO Fase 2: chiamata reale all'endpoint /v1/embeddings.
 * L'array ritornato DEVE avere lunghezza EMBEDDING_DIM (assertEmbeddingDim).
 */
async function embed(input: string): Promise<number[]> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  void apiKey;
  void input;
  void EMBEDDING_MODEL;

  throw new Error("embed non implementata (TODO Fase 2)");
}

/** Guardia: l'embedding deve allinearsi a vector(1536) prima di salvarlo. */
function assertEmbeddingDim(embedding: number[]): number[] {
  if (embedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `Embedding di dimensione ${embedding.length}, attesa ${EMBEDDING_DIM}`,
    );
  }
  return embedding;
}

/** Aggiorna parzialmente una riga items. */
async function updateItem(
  supabase: SupabaseClient,
  itemId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("items").update(patch).eq("id", itemId);
  if (error) throw new Error(`Update item fallito: ${error.message}`);
}
