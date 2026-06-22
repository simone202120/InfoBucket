// youtube-transcript.ts — Recupero del transcript pubblico di YouTube (§6.1).
//
// Strategia senza chiavi né headless browser:
//   1. scarica la pagina watch HTML;
//   2. estrae l'oggetto `ytInitialPlayerResponse` (JSON embedded);
//   3. legge le `captionTracks` e ne prende una (preferendo l'italiano);
//   4. scarica il `baseUrl` della traccia con `&fmt=json3` e ne unisce il testo.
//
// È un BEST EFFORT (YouTube cambia spesso e blocca gli IP cloud): se una qualsiasi
// fase fallisce ritorna null, e il chiamante degrada al percorso media (§6.1).
// Le parti di PARSING (HTML→playerResponse, json3→testo, scelta traccia) sono
// pure e testabili; solo l'orchestratore tocca la rete (fetcher iniettabile).

import { type Fetcher, fetchText } from "./fetch-remote.ts";
import { normalizeWhitespace } from "./text.ts";

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string; // 'asr' = sottotitoli automatici.
}

/**
 * Recupera il transcript di un video YouTube. Ritorna il testo unito, oppure
 * null se non disponibile (→ percorso media). Non lancia: gli errori di rete o
 * di parsing diventano null.
 */
export async function fetchYoutubeTranscript(
  watchUrl: string,
  fetcher: Fetcher = fetch,
): Promise<string | null> {
  try {
    const html = await fetchText(watchUrl, undefined, fetcher);
    const tracks = extractCaptionTracks(html);
    const track = pickTrack(tracks);
    if (!track) return null;

    const json3 = await fetchText(appendJson3(track.baseUrl), undefined, fetcher);
    const text = parseJson3Transcript(json3);
    return text === "" ? null : text;
  } catch {
    return null;
  }
}

/**
 * Estrae le captionTracks dall'HTML della pagina watch. Pura e testabile.
 * Cerca l'oggetto JSON `ytInitialPlayerResponse` e ne naviga la struttura nota.
 */
export function extractCaptionTracks(html: string): CaptionTrack[] {
  const player = extractPlayerResponse(html);
  if (!player) return [];

  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(tracks)) return [];

  return tracks
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => ({
      baseUrl: typeof t["baseUrl"] === "string" ? t["baseUrl"] : "",
      languageCode:
        typeof t["languageCode"] === "string" ? t["languageCode"] : undefined,
      kind: typeof t["kind"] === "string" ? t["kind"] : undefined,
    }))
    .filter((t) => t.baseUrl !== "");
}

/** Sceglie la traccia: preferisce l'italiano, poi l'inglese, poi la prima. */
export function pickTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const byLang = (lang: string) =>
    tracks.find((t) => (t.languageCode ?? "").toLowerCase().startsWith(lang));
  return byLang("it") ?? byLang("en") ?? tracks[0] ?? null;
}

/**
 * Converte la risposta json3 del timedtext nel testo del transcript. Pura.
 * Il formato json3 ha `events[].segs[].utf8` con i frammenti di testo.
 */
export function parseJson3Transcript(json: string): string {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return "";
  }
  if (!data || typeof data !== "object") return "";
  const events = (data as Record<string, unknown>)["events"];
  if (!Array.isArray(events)) return "";

  const parts: string[] = [];
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const segs = (ev as Record<string, unknown>)["segs"];
    if (!Array.isArray(segs)) continue;
    for (const seg of segs) {
      if (!seg || typeof seg !== "object") continue;
      const utf8 = (seg as Record<string, unknown>)["utf8"];
      if (typeof utf8 === "string") parts.push(utf8);
    }
  }
  return normalizeWhitespace(parts.join(""));
}

/** Aggiunge/forza il formato json3 al baseUrl della traccia. */
function appendJson3(baseUrl: string): string {
  return baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
}

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: unknown;
    };
  };
}

/**
 * Estrae l'oggetto JSON `ytInitialPlayerResponse` dall'HTML. Pura.
 * Localizza l'assegnazione e fa il parse bilanciando le parentesi graffe (il
 * JSON contiene `}` annidate, quindi una regex greedy non basta).
 */
function extractPlayerResponse(html: string): PlayerResponse | null {
  const marker = "ytInitialPlayerResponse";
  const at = html.indexOf(marker);
  if (at === -1) return null;

  const braceStart = html.indexOf("{", at);
  if (braceStart === -1) return null;

  const jsonText = sliceBalancedObject(html, braceStart);
  if (!jsonText) return null;

  try {
    return JSON.parse(jsonText) as PlayerResponse;
  } catch {
    return null;
  }
}

/**
 * Ritorna la sottostringa dell'oggetto JSON che inizia a `start` ('{') fino alla
 * graffa di chiusura bilanciata, ignorando graffe dentro stringhe ed escape.
 */
function sliceBalancedObject(s: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
