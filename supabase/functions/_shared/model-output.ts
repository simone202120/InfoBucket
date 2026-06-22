// model-output.ts — Parsing e validazione dell'output del modello AI (spec §6.2).
//
// L'output del modello è JSON NON FIDATO: va sempre validato prima dell'uso
// (CLAUDE.md §4 "Sicurezza by default"). Questo modulo è puro e testabile: non
// fa I/O, non lancia, ma ritorna un risultato discriminato (ok | error).
//
// Forma attesa (spec §6.2):
//   {
//     "summary": "…",
//     "tags": ["t1", "t2"],
//     "bucket": { "match": "existing|new|none",
//                 "existing_id": "uuid|null",
//                 "new_name": "string|null" }
//   }

export type BucketMatch = "existing" | "new" | "none";

export interface BucketSuggestion {
  match: BucketMatch;
  existingId: string | null;
  newName: string | null;
}

export interface ModelOutput {
  summary: string;
  tags: string[];
  bucket: BucketSuggestion;
}

export type ParseResult =
  | { ok: true; value: ModelOutput }
  | { ok: false; error: string };

const MAX_TAGS = 20;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Estrae, fa il parse e valida l'output del modello.
 *
 * Accetta sia una stringa grezza (eventualmente avvolta in un code-fence
 * ```json … ```), sia un oggetto già deserializzato. Robusto ai casi malformati:
 * ritorna sempre { ok: false, error } invece di lanciare.
 */
export function parseModelOutput(input: unknown): ParseResult {
  const parsed = coerceToObject(input);
  if (!parsed.ok) return parsed;
  const obj = parsed.value;

  // summary: stringa non vuota.
  const summary = obj["summary"];
  if (typeof summary !== "string" || summary.trim() === "") {
    return fail("summary mancante o non valido");
  }

  // tags: array di stringhe non vuote (normalizzate: trim, dedup, cap).
  const tags = normalizeTags(obj["tags"]);
  if (tags === null) return fail("tags non valido (atteso array di stringhe)");

  // bucket: oggetto con regole di coerenza fra match e campi correlati.
  const bucketResult = parseBucket(obj["bucket"]);
  if (!bucketResult.ok) return bucketResult;

  return {
    ok: true,
    value: { summary: summary.trim(), tags, bucket: bucketResult.value },
  };
}

/** Normalizza l'input in un oggetto JSON; gestisce stringhe e code-fence. */
function coerceToObject(
  input: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  let candidate: unknown = input;

  if (typeof input === "string") {
    const cleaned = stripCodeFence(input).trim();
    if (cleaned === "") return fail("output vuoto");
    try {
      candidate = JSON.parse(cleaned);
    } catch {
      return fail("JSON non valido");
    }
  }

  if (
    candidate === null ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    return fail("output non è un oggetto JSON");
  }
  return { ok: true, value: candidate as Record<string, unknown> };
}

/** Rimuove un eventuale wrapper ```json … ``` (o ``` … ```) dall'output. */
function stripCodeFence(s: string): string {
  const fence = s.match(/^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/i);
  return fence ? fence[1] : s;
}

/** Valida/normalizza i tag; null se la forma è errata. */
function normalizeTags(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    if (typeof t !== "string") return null;
    const tag = t.trim();
    if (tag === "") continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

type BucketResult =
  | { ok: true; value: BucketSuggestion }
  | { ok: false; error: string };

/** Valida l'oggetto bucket e la coerenza fra match e campi correlati. */
function parseBucket(raw: unknown): BucketResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return fail("bucket mancante o non valido");
  }
  const b = raw as Record<string, unknown>;

  const match = b["match"];
  if (match !== "existing" && match !== "new" && match !== "none") {
    return fail("bucket.match deve essere 'existing' | 'new' | 'none'");
  }

  const existingId = nullableString(b["existing_id"]);
  if (existingId === INVALID) return fail("bucket.existing_id non valido");
  const newName = nullableString(b["new_name"]);
  if (newName === INVALID) return fail("bucket.new_name non valido");

  // Coerenza: ogni match implica i campi sensati. I campi non pertinenti
  // vengono azzerati (non ci fidiamo del modello su ciò che è "fuori contesto").
  if (match === "existing") {
    if (!existingId || !UUID_RE.test(existingId)) {
      return fail("bucket.match=existing richiede un existing_id uuid valido");
    }
    return { ok: true, value: { match, existingId, newName: null } };
  }
  if (match === "new") {
    if (!newName || newName.trim() === "") {
      return fail("bucket.match=new richiede un new_name non vuoto");
    }
    return { ok: true, value: { match, existingId: null, newName: newName.trim() } };
  }
  // none
  return { ok: true, value: { match, existingId: null, newName: null } };
}

const INVALID = Symbol("invalid");

/** string | null per i campi opzionali; INVALID se di tipo errato. */
function nullableString(v: unknown): string | null | typeof INVALID {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  return INVALID;
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
