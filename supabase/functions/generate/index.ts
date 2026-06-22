// generate — Edge Function (spec §6.2). Il cuore AI, CONDIVISO da tutte le fonti.
//
// Riceve un item con raw_content già pronto (qualunque sia la fonte) e:
//   1. carica item + bucket dell'utente (service role);
//   2. costruisce il prompt (raw_content + note + bucket) → OpenRouter;
//   3. valida l'output del modello (NON fidato) con parseModelOutput;
//   4. genera l'embedding via OpenAI text-embedding-3-small → vector(1536);
//   5. aggiorna l'item a status='ready' con summary/tags/bucket proposto/embedding.
//
// Idempotente e riusabile per la RIGENERAZIONE (§6.3): opera sul raw_content GIÀ
// salvato, senza riscaricare la fonte. Errori che NON fanno sparire l'item
// (CLAUDE.md §4): qualunque fallimento salva `error` e lascia comunque l'item in
// inbox (status='ready' con messaggio). La validazione dell'output è una funzione
// PURA importata da _shared/model-output.ts.

import { createServiceClient, requireEnv } from "../_shared/supabase.ts";
import { parseModelOutput } from "../_shared/model-output.ts";
import {
  buildEmbeddingInput,
  type BucketInfo,
  buildPrompt,
  callOpenRouter,
  DEFAULT_OPENROUTER_MODEL,
  embed,
} from "../_shared/ai.ts";
import { errorResponse, jsonResponse, preflightResponse } from "../_shared/cors.ts";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ItemRow {
  id: string;
  user_id: string;
  raw_content: string | null;
  note: string | null;
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

  const supabase = createServiceClient();

  // Carica l'item. I bucket si filtrano per il suo proprietario (la service role
  // bypassa le RLS, quindi il filtro esplicito è necessario per isolare l'utente).
  const { data: item, error: fetchError } = await supabase
    .from("items")
    .select("id, user_id, raw_content, note")
    .eq("id", itemId)
    .single<ItemRow>();
  if (fetchError || !item) {
    return errorResponse("Item non trovato", 404, fetchError);
  }

  const { data: buckets } = await supabase
    .from("buckets")
    .select("id, name, description")
    .eq("user_id", item.user_id);

  try {
    await runGeneration(supabase, item, (buckets ?? []) as BucketInfo[]);
    return jsonResponse({ itemId: item.id, status: "ready" });
  } catch (e) {
    // Errore che non fa sparire l'item: resta in inbox con un messaggio.
    const message = e instanceof Error ? e.message : "errore di elaborazione";
    await applyResult(supabase, item.id, {
      status: "ready",
      processed_at: new Date().toISOString(),
      error: message,
    }).catch(() => {/* best-effort: non sovrascrivere l'errore originale */});
    return errorResponse("Generazione fallita", 500, e);
  }
});

/** Estrae itemId dal body, accettando sia `itemId` (camelCase) sia `item_id`. */
function readItemId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  const raw = obj["itemId"] ?? obj["item_id"];
  return typeof raw === "string" && UUID_RE.test(raw) ? raw : null;
}

/** Esegue i passi 2→5 (§6.2). Lancia in caso di errore (gestito dal chiamante). */
async function runGeneration(
  supabase: SupabaseClient,
  item: ItemRow,
  buckets: BucketInfo[],
): Promise<void> {
  // 2. Generazione (OpenRouter) → testo JSON non fidato.
  const messages = buildPrompt({
    rawContent: item.raw_content,
    note: item.note,
    buckets,
  });
  const rawModelText = await callOpenRouter(messages, {
    apiKey: requireEnv("OPENROUTER_API_KEY"),
    model: Deno.env.get("OPENROUTER_MODEL") ?? DEFAULT_OPENROUTER_MODEL,
  });

  // 3. Validazione dell'output del modello (funzione pura).
  const parsed = parseModelOutput(rawModelText);
  if (!parsed.ok) {
    // Output non valido: non perdiamo l'item, lo segnaliamo in inbox.
    await applyResult(supabase, item.id, {
      status: "ready",
      processed_at: new Date().toISOString(),
      error: `Output AI non valido: ${parsed.error}`,
    });
    return;
  }
  const output = parsed.value;

  // 4. Embedding (OpenAI). Sorgente: summary + raw_content + note (§6.2).
  const embedding = await embed(
    buildEmbeddingInput(output.summary, item.raw_content, item.note),
    { apiKey: requireEnv("OPENAI_API_KEY") },
  );

  // 5. Aggiorna l'item a 'ready' con i campi prodotti.
  await applyResult(supabase, item.id, {
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
}

/** Aggiorna parzialmente una riga items. */
async function applyResult(
  supabase: SupabaseClient,
  itemId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("items").update(patch).eq("id", itemId);
  if (error) throw new Error(`Update item fallito: ${error.message}`);
}
