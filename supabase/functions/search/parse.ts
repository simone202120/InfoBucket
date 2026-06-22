// parse.ts — Lettura/validazione del body della ricerca. Puro e testabile.

export const MAX_RESULTS = 50;
export const DEFAULT_RESULTS = 20;

/** Estrae e normalizza la query; "" se assente o non valida. */
export function readQuery(body: unknown): string {
  if (body && typeof body === "object" && "q" in body) {
    const q = (body as { q: unknown }).q;
    if (typeof q === "string") return q.trim();
  }
  return "";
}

/** Numero di risultati richiesto, vincolato a [1, MAX_RESULTS]; default DEFAULT_RESULTS. */
export function readLimit(body: unknown): number {
  if (body && typeof body === "object" && "limit" in body) {
    const n = (body as { limit: unknown }).limit;
    if (typeof n === "number" && Number.isInteger(n)) {
      return Math.min(Math.max(n, 1), MAX_RESULTS);
    }
  }
  return DEFAULT_RESULTS;
}
