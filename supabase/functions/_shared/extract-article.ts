// extract-article.ts — Estrazione del testo leggibile da una pagina articolo (§6.1).
//
// Strategia: @mozilla/readability (lo stesso algoritmo della Reader View di
// Firefox) su un DOM costruito con linkedom — entrambi funzionano in Deno via
// npm specifier e non richiedono un browser. Se readability non trova un articolo
// (paywall, SPA, HTML ostile) si DEGRADA a uno strip dei tag HTML (text.ts),
// così non restiamo mai senza raw_content.

import { Readability } from "npm:@mozilla/readability@0.5.0";
import { parseHTML } from "npm:linkedom@0.18.5";
import { htmlToText, normalizeWhitespace } from "./text.ts";

export interface ArticleExtraction {
  /** Testo leggibile estratto (può includere il titolo come prima riga). */
  text: string;
  /** Titolo, se individuato. */
  title: string | null;
}

/**
 * Estrae il contenuto leggibile da HTML grezzo. Funzione PURA rispetto alla rete
 * (riceve l'HTML già scaricato): testabile con HTML di esempio.
 *
 * @param html  HTML grezzo della pagina.
 * @param url   URL d'origine (readability lo usa per risolvere i link relativi).
 */
export function extractArticle(html: string, url: string): ArticleExtraction {
  const viaReadability = tryReadability(html, url);
  if (viaReadability && viaReadability.text.length > 0) return viaReadability;

  // Fallback: strip dei tag. Meglio un testo grezzo che nessun contenuto.
  const text = htmlToText(html);
  return { text, title: extractTitleTag(html) };
}

/** Tenta readability; ritorna null se non produce un articolo utile. */
function tryReadability(html: string, url: string): ArticleExtraction | null {
  try {
    // linkedom espone un Document compatibile con readability.
    const { document } = parseHTML(html);
    // readability usa baseURI per i link relativi; lo impostiamo via <base>.
    ensureBaseHref(document, url);

    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();
    if (!article) return null;

    const body = normalizeWhitespace(article.textContent ?? "");
    if (body === "") return null;

    const title = article.title?.trim() || null;
    const text = title ? `${title}\n\n${body}` : body;
    return { text, title };
  } catch {
    // readability/linkedom possono lanciare su HTML molto malformato: degradiamo.
    return null;
  }
}

/** Inserisce un <base href> se assente, così i link relativi si risolvono. */
function ensureBaseHref(document: Document, url: string): void {
  try {
    const head = document.querySelector("head");
    if (!head || head.querySelector("base")) return;
    const base = document.createElement("base");
    base.setAttribute("href", url);
    head.insertBefore(base, head.firstChild);
  } catch {
    // Non critico: senza <base> i link restano relativi, ma il testo si estrae.
  }
}

/** Estrae il contenuto del tag <title> come fallback al titolo di readability. */
function extractTitleTag(html: string): string | null {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const title = normalizeWhitespace(htmlToText(m[1]));
  return title === "" ? null : title;
}
