// extract-document.ts — Estrazione del testo da un file caricato (§6.1).
//
// Supporta: PDF (via unpdf, build serverless di PDF.js — funziona in Deno) e
// testo semplice (text/plain, markdown, csv). Per i formati non gestiti NON
// lancia un errore opaco: ritorna un esito 'unsupported' così il chiamante può
// salvare un messaggio utile e lasciare l'item in inbox (CLAUDE.md §4).

import { extractText, getDocumentProxy } from "npm:unpdf@1.6.2";
import { normalizeWhitespace } from "./text.ts";

export type DocumentExtraction =
  | { ok: true; text: string }
  | { ok: false; reason: string };

const PLAIN_TEXT_TYPES = ["text/plain", "text/markdown", "text/csv"];
const PLAIN_TEXT_EXT = [".txt", ".md", ".markdown", ".csv", ".text"];

/**
 * Estrae il testo dai byte di un documento. Funzione PURA rispetto alla rete
 * (riceve i byte già scaricati da Storage): l'instradamento per formato è
 * testabile senza I/O.
 *
 * @param bytes        contenuto del file.
 * @param fileType     MIME type dichiarato (items.file_type), se noto.
 * @param storagePath  path/nome del file, per inferire l'estensione.
 */
export async function extractDocument(
  bytes: Uint8Array,
  fileType: string | null,
  storagePath: string | null,
): Promise<DocumentExtraction> {
  if (isPdf(fileType, storagePath)) {
    return await extractPdf(bytes);
  }
  if (isPlainText(fileType, storagePath)) {
    const text = normalizeWhitespace(new TextDecoder("utf-8").decode(bytes));
    if (text === "") return { ok: false, reason: "Il documento di testo è vuoto." };
    return { ok: true, text };
  }
  return {
    ok: false,
    reason: `Formato documento non supportato (${fileType ?? "sconosciuto"}).`,
  };
}

function isPdf(fileType: string | null, path: string | null): boolean {
  if (fileType && fileType.toLowerCase().includes("pdf")) return true;
  return !!path && path.toLowerCase().endsWith(".pdf");
}

function isPlainText(fileType: string | null, path: string | null): boolean {
  if (fileType && PLAIN_TEXT_TYPES.some((t) => fileType.toLowerCase().startsWith(t))) {
    return true;
  }
  const lower = path?.toLowerCase() ?? "";
  return PLAIN_TEXT_EXT.some((ext) => lower.endsWith(ext));
}

/** Estrae il testo da un PDF; degrada con un messaggio se PDF.js fallisce. */
async function extractPdf(bytes: Uint8Array): Promise<DocumentExtraction> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const normalized = normalizeWhitespace(Array.isArray(text) ? text.join("\n") : text);
    if (normalized === "") {
      return {
        ok: false,
        reason: "Il PDF non contiene testo estraibile (forse è solo immagini).",
      };
    }
    return { ok: true, text: normalized };
  } catch {
    return { ok: false, reason: "Estrazione del testo dal PDF fallita." };
  }
}
