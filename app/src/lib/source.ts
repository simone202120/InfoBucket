/**
 * Rilevamento del tipo di fonte da un URL — logica pura, riusata per l'anteprima
 * in fase di cattura. L'instradamento autorevole resta nella Edge Function
 * `dispatch` (infobucket-spec.md §6.1); qui replichiamo solo la classificazione.
 */
import type { SourceType } from '../types/domain';

/** Estrae l'hostname normalizzato (senza www), o null se l'URL non è valido. */
export function hostnameOf(url: string): string | null {
  try {
    return new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Classifica una fonte dall'URL. Senza URL valido → 'other'. */
export function detectSourceType(url: string | null | undefined): SourceType {
  if (!url) return 'other';
  const host = hostnameOf(url);
  if (!host) return 'other';
  if (host === 'youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')) return 'youtube';
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'reel';
  return 'article';
}

/**
 * Estrae il primo URL http(s) da un testo condiviso (lo share intent può passare
 * "Guarda qui https://…" invece di un URL pulito). Null se non ce n'è.
 */
export function extractFirstUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

/** URL della favicon del dominio (servizio pubblico Google). */
export function faviconUrl(host: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;
}

/** True se l'URL è http/https ben formato (validazione input esterno). */
export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
