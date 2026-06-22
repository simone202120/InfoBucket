// text.ts — Utilità pure su testo (normalizzazione e troncamento).
//
// Usate dall'estrazione (articolo/documento) e dalla generazione (input per
// l'embedding/prompt). Funzioni pure e testabili: niente I/O.

/**
 * Normalizza spazi bianchi: collassa le sequenze di spazi/tab, riduce le righe
 * vuote multiple a una sola, fa il trim. Mantiene la struttura a paragrafi
 * (utile a leggibilità e a un buon riassunto), senza il rumore di pagine HTML.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Tronca il testo a un massimo di caratteri senza spezzare a metà parola quando
 * possibile (taglia all'ultimo confine di spazio entro il limite). Idempotente
 * sotto il limite. Usato per contenere i token inviati a OpenRouter/OpenAI:
 * l'euristica caratteri→token è grossolana ma sufficiente e priva di dipendenze.
 */
export function truncateChars(text: string, maxChars: number): string {
  if (maxChars <= 0) return "";
  if (text.length <= maxChars) return text;

  const hardCut = text.slice(0, maxChars);
  const lastSpace = hardCut.lastIndexOf(" ");
  // Tagliamo all'ultimo spazio solo se non perdiamo troppo (>80% del limite),
  // altrimenti un testo senza spazi (es. base64) verrebbe svuotato.
  const cut = lastSpace > maxChars * 0.8 ? hardCut.slice(0, lastSpace) : hardCut;
  return cut.trimEnd();
}

/** Fallback robusto: estrae testo leggibile da HTML senza un parser DOM. */
export function htmlToText(html: string): string {
  const withoutBlocks = html
    // Rimuove interamente blocchi non testuali (script/style/noscript/svg).
    .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    // I commenti HTML.
    .replace(/<!--[\s\S]*?-->/g, " ");

  const withBreaks = withoutBlocks
    // Trasforma i separatori di blocco in newline per non incollare le parole.
    .replace(/<\/(p|div|section|article|h[1-6]|li|tr|br)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const stripped = withBreaks.replace(/<[^>]+>/g, " ");
  return normalizeWhitespace(decodeEntities(stripped));
}

/** Decodifica le entità HTML più comuni (sufficiente per testo leggibile). */
function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };
  return s
    .replace(/&(amp|lt|gt|quot|apos|nbsp);|&#39;/g, (m) => named[m] ?? m)
    .replace(/&#(\d+);/g, (_, code) => safeFromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeFromCodePoint(parseInt(hex, 16)));
}

function safeFromCodePoint(code: number): string {
  if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}
