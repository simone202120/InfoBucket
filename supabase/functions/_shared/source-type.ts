// source-type.ts — Rilevamento del source_type (spec §6.1).
//
// Funzione PURA e testabile: data l'URL (e l'eventuale presenza di un file in
// Storage) ritorna il source_type. Allineata agli enum SQL (item_status,
// source_type, media_stage) e a app/src/types/domain.ts.

export type SourceType =
  | "article"
  | "youtube"
  | "reel"
  | "tiktok"
  | "document"
  | "other";

export interface SourceTypeInput {
  /** URL condiviso/incollato. Può essere null per i documenti caricati. */
  url: string | null;
  /** Path del file in Supabase Storage, se l'item è un documento caricato. */
  storagePath?: string | null;
}

/**
 * Determina il source_type secondo le regole della spec §6.1:
 *   - youtube.com / youtu.be            → 'youtube'
 *   - tiktok.com                        → 'tiktok'
 *   - instagram.com                     → 'reel'
 *   - presenza di storage_path          → 'document'
 *   - altrimenti URL http(s)            → 'article'
 *   - altrimenti                        → 'other'
 *
 * Funzione pura: nessun I/O, nessuna eccezione su input malformato.
 */
export function detectSourceType(input: SourceTypeInput): SourceType {
  // Un file caricato è sempre un documento, a prescindere dall'URL.
  if (input.storagePath) return "document";

  const raw = input.url?.trim();
  if (!raw) return "other";

  const host = parseHost(raw);
  if (!host) return "other";

  if (matchesDomain(host, "youtube.com") || matchesDomain(host, "youtu.be")) {
    return "youtube";
  }
  if (matchesDomain(host, "tiktok.com")) return "tiktok";
  if (matchesDomain(host, "instagram.com")) return "reel";

  // URL http(s) valido ma non riconosciuto → articolo.
  return "article";
}

/** Estrae l'host (lowercase, senza 'www.') da un URL http(s); null se non valido. */
function parseHost(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return parsed.hostname.toLowerCase().replace(/^www\./, "");
}

/** true se host è il dominio stesso o un suo sottodominio (no match parziali). */
function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith("." + domain);
}
