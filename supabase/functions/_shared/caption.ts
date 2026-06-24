// caption.ts — Estrazione metadati leggeri (caption/autore) per tiktok/reel,
// lato server (spec §6.1, §7.2). Gemello PURO di worker/src/extract/caption.ts:
// la stessa logica vive nei due runtime (Deno qui, Node nel worker), come per
// source-type.ts, perché entrambi devono saperla fare ma non condividono codice.
//
// Lo scopo è dare un riassunto utile SUBITO dalla didascalia — che per TikTok
// (oEmbed) è pubblica e non richiede login — senza dipendere dal worker. La
// trascrizione audio resta un arricchimento opzionale del worker.
//
// Tutti gli input remoti sono NON fidati: si validano i tipi e si degrada a campi
// nulli, mai propagare dati malformati (CLAUDE.md §5).

/** Metadati leggeri estratti dalla fonte. */
export interface CaptionMetadata {
  /** Titolo o caption del contenuto, se disponibile. */
  caption: string | null;
  /** Handle/nome autore, se disponibile. */
  author: string | null;
}

/** Tipi-fonte la cui caption si estrae via HTTP leggero (senza yt-dlp). */
export type LightCaptionType = "tiktok" | "reel" | "youtube";

const EMPTY: CaptionMetadata = { caption: null, author: null };

/** Trim → null se vuoto. Difende dai campi remoti vuoti o solo-spazi. */
function nullable(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** URL ufficiale oEmbed di TikTok per una data fonte. */
export function tiktokOembedUrl(sourceUrl: string): string {
  return `https://www.tiktok.com/oembed?url=${encodeURIComponent(sourceUrl)}`;
}

/**
 * Parsing della risposta oEmbed di TikTok. Funzione PURA.
 * Formato atteso: `{ title, author_name, author_unique_id?, ... }`.
 */
export function parseTiktokOembed(json: unknown): CaptionMetadata {
  if (json === null || typeof json !== "object") return EMPTY;
  const obj = json as Record<string, unknown>;

  const caption = nullable(obj.title);
  // Preferisci lo unique id (@handle) se presente, altrimenti il nome leggibile.
  const handle = nullable(obj.author_unique_id);
  const name = nullable(obj.author_name);
  const author = handle ? `@${handle}` : name;

  return { caption, author };
}

/** URL ufficiale oEmbed di YouTube per una data fonte. */
export function youtubeOembedUrl(sourceUrl: string): string {
  return `https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`;
}

/**
 * Parsing della risposta oEmbed di YouTube. Funzione PURA.
 * Formato atteso: `{ title, author_name, ... }`. Diversamente da TikTok non c'è
 * un handle: l'autore è il nome del canale.
 */
export function parseYoutubeOembed(json: unknown): CaptionMetadata {
  if (json === null || typeof json !== "object") return EMPTY;
  const obj = json as Record<string, unknown>;
  return { caption: nullable(obj.title), author: nullable(obj.author_name) };
}

/**
 * Parsing dei meta tag Open Graph da una pagina HTML. Funzione PURA. Best-effort,
 * usato per Instagram (fragile, §17): estrae i `<meta>` con regex tollerante.
 */
export function parseOpenGraph(html: string): CaptionMetadata {
  if (typeof html !== "string" || html === "") return EMPTY;

  const tags = extractMetaTags(html);
  const title = tags["og:title"] ?? tags["twitter:title"] ?? null;
  const description = tags["og:description"] ?? tags["twitter:description"] ??
    null;

  // og:title su IG è tipicamente "Autore on Instagram: ..."; la descrizione è la
  // caption vera quando c'è, il titolo è il fallback.
  const caption = description ?? title;
  const author = parseInstagramAuthor(title);

  return { caption, author };
}

/** Estrae una mappa `property/name -> content` dai tag `<meta>`. */
export function extractMetaTags(html: string): Record<string, string> {
  const result: Record<string, string> = {};
  const metaRe = /<meta\b[^>]*>/gi;
  for (const match of html.matchAll(metaRe)) {
    const tag = match[0];
    const key = attr(tag, "property") ?? attr(tag, "name");
    if (!key) continue;
    const content = attr(tag, "content");
    if (content === null) continue;
    const cleaned = nullable(decodeEntities(content));
    if (cleaned !== null && !(key in result)) result[key] = cleaned;
  }
  return result;
}

/** Legge un attributo HTML (virgolette doppie o singole) da un singolo tag. */
function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  const m = re.exec(tag);
  if (!m) return null;
  return m[2] ?? m[3] ?? null;
}

/** Estrae l'autore dal pattern IG "Nome (@handle) on Instagram: ...". */
function parseInstagramAuthor(title: string | null): string | null {
  if (!title) return null;
  const handle = /\(@([A-Za-z0-9._]+)\)/.exec(title);
  if (handle?.[1]) return `@${handle[1]}`;
  const onInsta = /^(.+?)\s+on Instagram/i.exec(title);
  return onInsta?.[1] ? onInsta[1].trim() : null;
}

/** Decodifica le entità HTML più comuni (sufficiente per i meta tag). */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

/**
 * Compone il blocco etichettato `[Caption]/[Autore]` (gemello di
 * worker/src/rawContent.ts, ma qui senza trascrizione: quella la aggiunge il
 * worker). Include solo le sezioni presenti; tutto vuoto → stringa vuota.
 */
export function composeCaptionRawContent(meta: CaptionMetadata): string {
  const sections: string[] = [];
  const caption = nullable(meta.caption);
  const author = nullable(meta.author);
  if (caption) sections.push(`[Caption] ${caption}`);
  if (author) sections.push(`[Autore] ${author}`);
  return sections.join("\n");
}

/** Fetch testuale iniettabile (default: il `fetchText` difensivo di _shared). */
export type FetchText = (url: string) => Promise<string>;

/**
 * Recupera i metadati leggeri per tiktok/reel. Degrada a EMPTY su qualunque
 * errore: la caption è opzionale, il flusso prosegue (il worker tenterà l'audio).
 */
export async function fetchLightCaption(
  sourceType: LightCaptionType,
  sourceUrl: string,
  fetchText: FetchText,
): Promise<CaptionMetadata> {
  try {
    if (sourceType === "tiktok") {
      const body = await fetchText(tiktokOembedUrl(sourceUrl));
      return parseTiktokOembed(JSON.parse(body));
    }
    if (sourceType === "youtube") {
      // oEmbed pubblico di YouTube: titolo + canale, senza chiavi né login. Dà un
      // riassunto utile SUBITO quando il transcript pubblico non è disponibile.
      const body = await fetchText(youtubeOembedUrl(sourceUrl));
      return parseYoutubeOembed(JSON.parse(body));
    }
    // reel (Instagram): best-effort via Open Graph della pagina pubblica.
    const html = await fetchText(sourceUrl);
    return parseOpenGraph(html);
  } catch {
    return EMPTY;
  }
}
