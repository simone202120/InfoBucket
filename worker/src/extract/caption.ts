/**
 * Estrazione di metadati leggeri (caption/autore) dalle fonti media (§7.2).
 *
 * Tutto ciò che è rete è dietro un `Fetcher` iniettabile (stub in Fase 6); il
 * PARSING è isolato in funzioni pure e testabili. Gli input remoti NON sono
 * fidati: validiamo i tipi e degradiamo a `null` invece di propagare dati
 * malformati (CLAUDE.md §4 — valida input esterni).
 */
import type { CaptionMetadata, MediaSourceType } from '../types.ts';

/** Tipo di fetch iniettabile: `(url) => corpo della risposta`. */
export type Fetcher = (url: string) => Promise<string>;

const EMPTY: CaptionMetadata = { caption: null, author: null };

/** Trim → null se vuoto. Difende dai campi remoti vuoti o solo-spazi. */
function nullable(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Parsing della risposta oEmbed di TikTok. Funzione PURA.
 * Formato atteso: `{ title, author_name, author_unique_id?, ... }`.
 * L'input è `unknown` (JSON remoto non fidato): si valida prima di leggere.
 */
export function parseTiktokOembed(json: unknown): CaptionMetadata {
  if (json === null || typeof json !== 'object') return EMPTY;
  const obj = json as Record<string, unknown>;

  const caption = nullable(obj.title);
  // Preferisci lo unique id (@handle) se presente, altrimenti il nome leggibile.
  const handle = nullable(obj.author_unique_id);
  const name = nullable(obj.author_name);
  const author = handle ? `@${handle}` : name;

  return { caption, author };
}

/**
 * Parsing dei meta tag Open Graph da una pagina HTML. Funzione PURA.
 * Best-effort: usato soprattutto per Instagram, che è fragile (§17) e a volte
 * espone solo una parte. Non costruiamo un DOM: estraiamo i `<meta>` con regex
 * tollerante all'ordine degli attributi e alle virgolette singole/doppie.
 */
export function parseOpenGraph(html: string): CaptionMetadata {
  if (typeof html !== 'string' || html === '') return EMPTY;

  const tags = extractMetaTags(html);
  const title = tags['og:title'] ?? tags['twitter:title'] ?? null;
  const description = tags['og:description'] ?? tags['twitter:description'] ?? null;

  // og:title su IG è tipicamente "Autore on Instagram: ..."; usiamo la
  // descrizione come caption quando c'è, il titolo come fallback.
  const caption = description ?? title;
  const author = parseInstagramAuthor(title);

  return { caption, author };
}

/**
 * Estrae una mappa `property/name -> content` dai tag `<meta>` di una pagina.
 * Esportata per i test: copre l'ordine `property`-prima e `content`-prima.
 */
export function extractMetaTags(html: string): Record<string, string> {
  const result: Record<string, string> = {};
  const metaRe = /<meta\b[^>]*>/gi;
  for (const match of html.matchAll(metaRe)) {
    const tag = match[0];
    const key = attr(tag, 'property') ?? attr(tag, 'name');
    if (!key) continue;
    const content = attr(tag, 'content');
    if (content === null) continue;
    const cleaned = nullable(decodeEntities(content));
    if (cleaned !== null && !(key in result)) result[key] = cleaned;
  }
  return result;
}

/** Legge un attributo HTML (virgolette doppie o singole) da un singolo tag. */
function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i');
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
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

/** URL ufficiale oEmbed di TikTok per una data fonte. */
export function tiktokOembedUrl(sourceUrl: string): string {
  return `https://www.tiktok.com/oembed?url=${encodeURIComponent(sourceUrl)}`;
}

/**
 * Recupera i metadati leggeri per una fonte media. Sceglie la strategia per
 * `source_type` e degrada a EMPTY su qualunque errore: la caption è opzionale,
 * il flusso prosegue comunque con audio + nota (§7.2, §17).
 *
 * `fetcher` è iniettabile per i test; in produzione sarà un wrapper su `fetch`.
 */
export async function fetchCaptionMetadata(
  sourceType: MediaSourceType,
  sourceUrl: string,
  fetcher: Fetcher,
): Promise<CaptionMetadata> {
  try {
    switch (sourceType) {
      case 'tiktok': {
        const body = await fetcher(tiktokOembedUrl(sourceUrl));
        return parseTiktokOembed(JSON.parse(body));
      }
      case 'reel': {
        // Instagram: best-effort via Open Graph della pagina pubblica.
        const html = await fetcher(sourceUrl);
        return parseOpenGraph(html);
      }
      case 'youtube': {
        // TODO Fase 6: recuperare titolo + descrizione via oEmbed YouTube
        // (https://www.youtube.com/oembed?url=...&format=json) o yt-dlp
        // (`--dump-json`, niente download dello stream). Per ora i metadati
        // arriveranno comunque dal JSON di yt-dlp in media.ts.
        return EMPTY;
      }
    }
  } catch {
    // Nessun dettaglio interno nei log: la caption è opzionale per design.
    return EMPTY;
  }
}
