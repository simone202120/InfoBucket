// ai.ts — Provider AI per `generate` (§6.2): prompt, OpenRouter, embedding OpenAI.
//
// Due provider distinti (spec §3, §17):
//   - OpenRouter → generazione (summary/tag/bucket). Modello da OPENROUTER_MODEL.
//   - OpenAI     → embedding (text-embedding-3-small → vector(1536)).
// La COSTRUZIONE del prompt è una funzione pura e testabile; le chiamate di rete
// usano un fetcher iniettabile (niente rete reale nei test).

import { type Fetcher } from "./fetch-remote.ts";
import { truncateChars } from "./text.ts";

export const EMBEDDING_MODEL = "text-embedding-3-small"; // → vector(1536)
export const EMBEDDING_DIM = 1536;
export const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

// Limiti di contesto (euristica caratteri, ~4 char/token). Conservativi: un
// modello flash gestisce ben oltre, ma teniamo costi e latenza bassi.
const MAX_RAW_CONTENT_CHARS = 24_000;
const MAX_NOTE_CHARS = 2_000;
const MAX_EMBEDDING_CHARS = 16_000;

const REQUEST_TIMEOUT_MS = 60_000;

export interface BucketInfo {
  id: string;
  name: string;
  description: string | null;
}

export interface PromptInput {
  rawContent: string | null;
  note: string | null;
  buckets: readonly BucketInfo[];
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

const SYSTEM_PROMPT = [
  "Sei l'assistente di InfoBucket, un'app personale per organizzare contenuti salvati.",
  "Ricevi il contenuto grezzo di un elemento (articolo, documento o trascrizione),",
  "una nota dell'utente e l'elenco dei suoi bucket (collezioni).",
  "Il tuo compito: produrre un riassunto conciso ma fedele, 3-6 tag, e suggerire",
  "il bucket più adatto. La NOTA dell'utente è una GUIDA prioritaria: se chiede di",
  "concentrarti su un aspetto o di estrarre qualcosa di specifico, seguila.",
  "Scrivi nella lingua del contenuto (di norma italiano).",
  "Per il bucket: usa 'existing' con l'id esatto se uno calza bene; 'new' con un",
  "nome breve se nessuno calza ma ne servirebbe uno; 'none' se non sei sicuro.",
  "Rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, in questa forma:",
  '{"summary": string, "tags": string[3..6], "bucket": {"match": "existing"|"new"|"none", "existing_id": string|null, "new_name": string|null}}',
].join("\n");

/**
 * Costruisce i messaggi (system + user) per OpenRouter. Pura e testabile.
 * Tronca raw_content e note per contenere i token; elenca i bucket con id/nome/
 * descrizione (servono al matching, §8).
 */
export function buildPrompt(input: PromptInput): ChatMessage[] {
  const rawContent = truncateChars((input.rawContent ?? "").trim(), MAX_RAW_CONTENT_CHARS);
  const note = truncateChars((input.note ?? "").trim(), MAX_NOTE_CHARS);

  const bucketList = input.buckets.length === 0
    ? "(nessun bucket esistente)"
    : input.buckets
      .map((b) => {
        const desc = b.description?.trim() ? ` — ${b.description.trim()}` : "";
        return `- id: ${b.id} | nome: ${b.name}${desc}`;
      })
      .join("\n");

  const userContent = [
    "## Bucket esistenti",
    bucketList,
    "",
    "## Nota dell'utente (guida)",
    note === "" ? "(nessuna nota)" : note,
    "",
    "## Contenuto grezzo",
    rawContent === "" ? "(nessun contenuto estratto)" : rawContent,
  ].join("\n");

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];
}

/** Compone l'input per l'embedding: summary + raw_content + note, troncato. */
export function buildEmbeddingInput(
  summary: string,
  rawContent: string | null,
  note: string | null,
): string {
  const joined = [summary, rawContent, note]
    .filter((s): s is string => !!s && s.trim() !== "")
    .join("\n");
  return truncateChars(joined, MAX_EMBEDDING_CHARS);
}

/**
 * Chiama OpenRouter e ritorna il TESTO grezzo della risposta del modello (atteso
 * JSON, validato a valle da parseModelOutput). Forza l'output JSON via
 * response_format e istruzioni nel system prompt (doppia difesa).
 */
export async function callOpenRouter(
  messages: ChatMessage[],
  opts: { apiKey: string; model: string },
  fetcher: Fetcher = fetch,
): Promise<string> {
  const body = {
    model: opts.model,
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  const res = await postJson(
    OPENROUTER_URL,
    body,
    {
      "Authorization": `Bearer ${opts.apiKey}`,
      // Header consigliati da OpenRouter per identificare l'app (non segreti).
      "HTTP-Referer": "https://github.com/infobucket",
      "X-Title": "InfoBucket",
    },
    fetcher,
  );

  const content = res?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Risposta OpenRouter priva di contenuto");
  }
  return content;
}

/**
 * Genera l'embedding via OpenAI text-embedding-3-small. Ritorna un array di
 * EMBEDDING_DIM numeri; lancia se la forma non è quella attesa.
 */
export async function embed(
  input: string,
  opts: { apiKey: string },
  fetcher: Fetcher = fetch,
): Promise<number[]> {
  const res = await postJson(
    OPENAI_EMBEDDINGS_URL,
    { model: EMBEDDING_MODEL, input },
    { "Authorization": `Bearer ${opts.apiKey}` },
    fetcher,
  );

  const vector = res?.data?.[0]?.embedding;
  if (!Array.isArray(vector) || !vector.every((n) => typeof n === "number")) {
    throw new Error("Risposta embedding OpenAI non valida");
  }
  if (vector.length !== EMBEDDING_DIM) {
    throw new Error(
      `Embedding di dimensione ${vector.length}, attesa ${EMBEDDING_DIM}`,
    );
  }
  return vector as number[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// POST JSON con timeout; ritorna il corpo deserializzato. Tipi 'any' confinati
// qui: le risposte dei provider sono validate dai chiamanti (forma nota).
async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  fetcher: Fetcher,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetcher(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Non logghiamo il corpo: può contenere dati o dettagli sensibili.
      throw new Error(`Provider AI ha risposto HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(`Timeout della chiamata AI (${REQUEST_TIMEOUT_MS} ms)`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
