// youtube.ts — Estrazione contenuto YouTube lato server (§6.1), senza worker.
//
// Obiettivo: dare a `generate` un raw_content RICCO già nel percorso leggero
// (Edge Function, sempre attiva), così un video YouTube produce un riassunto
// utile anche se il worker media non è in esecuzione. Tre fonti, in ordine di
// affidabilità da IP datacenter (dove la pagina watch HTML incontra il muro del
// consenso e spesso non espone nulla):
//
//   1. InnerTube `player` (POST): l'API interna che usa l'app YouTube. Ritorna
//      `videoDetails` (titolo, canale e soprattutto la DESCRIZIONE — le info
//      "scritte sotto il video") e le `captionTracks` (sottotitoli pubblici).
//   2. Pagina watch HTML: fallback se InnerTube non risponde; si estrae lo stesso
//      `ytInitialPlayerResponse`.
//   3. oEmbed pubblico: ultimo fallback per titolo + canale.
//
// La trascrizione pubblica (sottotitoli) è BEST EFFORT: se i timedtext non sono
// scaricabili, il contenuto resta titolo+descrizione e il worker arricchirà con
// la trascrizione audio (Whisper). Le parti di PARSING sono pure e testabili; gli
// input remoti sono NON fidati (validazione difensiva dei tipi, §5).

import { DEFAULT_LIMITS, type Fetcher, type FetchLimits, fetchText } from "./fetch-remote.ts";
import { normalizeWhitespace } from "./text.ts";
import { parseYoutubeOembed, youtubeOembedUrl } from "./caption.ts";

const REQUEST_TIMEOUT_MS = 15_000;

// InnerTube: endpoint e chiave WEB pubblici (NON un segreto: sono incorporati in
// ogni pagina youtube.com e usati da tutte le librerie). Il client ANDROID evita
// il muro del consenso e restituisce videoDetails + captionTracks da IP server.
const INNERTUBE_PLAYER_URL =
  "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_ANDROID_CONTEXT = {
  client: {
    clientName: "ANDROID",
    clientVersion: "19.09.37",
    androidSdkVersion: 30,
    hl: "it",
    gl: "IT",
  },
};
const ANDROID_USER_AGENT =
  "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip";

// I server YouTube servono pagine/timedtext degradati a User-Agent "bot": per gli
// scaricamenti GET (watch HTML, oEmbed, timedtext) usiamo un UA browser e l'IT.
const YT_LIMITS: FetchLimits = {
  timeoutMs: REQUEST_TIMEOUT_MS,
  maxBytes: DEFAULT_LIMITS.maxBytes,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/** Metadati + trascrizione di un video, pronti per comporre il raw_content. */
export interface YoutubeContent {
  /** Titolo + descrizione uniti (le info sotto il video), o null. */
  caption: string | null;
  /** Nome del canale, o null. */
  author: string | null;
  /** Trascrizione dai sottotitoli pubblici, o null se non disponibili. */
  transcript: string | null;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string; // 'asr' = sottotitoli automatici.
}

interface VideoDetails {
  title: string | null;
  author: string | null;
  description: string | null;
}

/** Trim → null se vuoto. Difende dai campi remoti vuoti o solo-spazi. */
function nullable(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Estrae l'id di 11 caratteri da una qualunque forma di URL YouTube
 * (watch?v=, youtu.be/, /shorts/, /embed/, /live/). Pura; null se non trovato.
 */
export function parseVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const isId = (s: string | null): s is string => !!s && /^[A-Za-z0-9_-]{11}$/.test(s);

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0] ?? "";
    return isId(id) ? id : null;
  }
  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    const v = parsed.searchParams.get("v");
    if (isId(v)) return v;
    // /shorts/<id>, /embed/<id>, /live/<id>: l'id è il secondo segmento.
    const seg = parsed.pathname.split("/").filter(Boolean);
    if (seg.length >= 2 && ["shorts", "embed", "live", "v"].includes(seg[0] ?? "")) {
      return isId(seg[1] ?? null) ? (seg[1] as string) : null;
    }
  }
  return null;
}

/**
 * Estrae titolo/canale/descrizione da un player response (InnerTube o HTML).
 * Pura: valida la forma di `videoDetails` prima di leggere (input non fidato).
 */
export function parseVideoDetails(player: unknown): VideoDetails {
  const vd = (player as { videoDetails?: unknown })?.videoDetails;
  if (!vd || typeof vd !== "object") {
    return { title: null, author: null, description: null };
  }
  const obj = vd as Record<string, unknown>;
  return {
    title: nullable(obj.title),
    author: nullable(obj.author),
    description: nullable(obj.shortDescription),
  };
}

/**
 * Estrae le captionTracks da un player response GIÀ deserializzato (InnerTube o
 * HTML). Pura e testabile; scarta le tracce senza baseUrl.
 */
export function extractCaptionTracksFromPlayer(player: unknown): CaptionTrack[] {
  const tracks = (player as {
    captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: unknown } };
  })?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
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

/**
 * Estrae le captionTracks dall'HTML della pagina watch. Pura e testabile.
 * Localizza `ytInitialPlayerResponse` e ne naviga la struttura nota.
 */
export function extractCaptionTracks(html: string): CaptionTrack[] {
  return extractCaptionTracksFromPlayer(extractPlayerResponse(html));
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

/**
 * Unisce titolo e descrizione in un'unica caption (le info sotto il video).
 * Pura; gemella di `parseYoutubeDump` nel worker per coerenza di formato.
 */
export function mergeCaption(
  title: string | null,
  description: string | null,
): string | null {
  if (title && description) return `${title}\n${description}`;
  return title ?? description ?? null;
}

/**
 * Recupera metadati + trascrizione pubblica di un video. NON lancia: ogni fonte
 * degrada a vuoto, così il chiamante (dispatch) compone comunque ciò che c'è e
 * fa proseguire la pipeline. Il `fetcher` è iniettabile per i test.
 */
export async function fetchYoutubeContent(
  url: string,
  fetcher: Fetcher = fetch,
): Promise<YoutubeContent> {
  const videoId = parseVideoId(url);
  let details: VideoDetails = { title: null, author: null, description: null };
  let tracks: CaptionTrack[] = [];

  // 1. InnerTube player: la via più affidabile da server (descrizione + tracce).
  if (videoId) {
    const player = await fetchInnertubePlayer(videoId, fetcher);
    if (player) {
      details = parseVideoDetails(player);
      tracks = extractCaptionTracksFromPlayer(player);
    }
  }

  // 2. Fallback: pagina watch HTML (titolo/descrizione e tracce, se InnerTube no).
  if (!details.title && !details.description) {
    try {
      const html = await fetchText(url, YT_LIMITS, fetcher);
      const player = extractPlayerResponse(html);
      if (player) {
        details = fillDetails(details, parseVideoDetails(player));
        if (tracks.length === 0) tracks = extractCaptionTracksFromPlayer(player);
      }
    } catch {
      // best-effort: la pagina può essere un muro del consenso o un 4xx.
    }
  }

  // 3. Fallback ulteriore per titolo/canale: oEmbed pubblico.
  if (!details.title || !details.author) {
    try {
      const body = await fetchText(youtubeOembedUrl(url), YT_LIMITS, fetcher);
      const meta = parseYoutubeOembed(JSON.parse(body));
      details = fillDetails(details, {
        title: meta.caption,
        author: meta.author,
        description: null,
      });
    } catch {
      // best-effort: oEmbed può rispondere 401/404 per alcuni video.
    }
  }

  return {
    caption: mergeCaption(details.title, details.description),
    author: details.author,
    transcript: await fetchTranscript(tracks, fetcher),
  };
}

/** Completa i campi mancanti di `base` con quelli di `extra` (non sovrascrive). */
function fillDetails(base: VideoDetails, extra: VideoDetails): VideoDetails {
  return {
    title: base.title ?? extra.title,
    author: base.author ?? extra.author,
    description: base.description ?? extra.description,
  };
}

/** Scarica e unisce la trascrizione dalla traccia scelta. Best-effort → null. */
async function fetchTranscript(
  tracks: CaptionTrack[],
  fetcher: Fetcher,
): Promise<string | null> {
  const track = pickTrack(tracks);
  if (!track) return null;
  try {
    const json3 = await fetchText(appendJson3(track.baseUrl), YT_LIMITS, fetcher);
    const text = parseJson3Transcript(json3);
    return text === "" ? null : text;
  } catch {
    return null;
  }
}

/** POST all'InnerTube player. Ritorna il JSON deserializzato o null su errore. */
async function fetchInnertubePlayer(
  videoId: string,
  fetcher: Fetcher,
): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetcher(INNERTUBE_PLAYER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": ANDROID_USER_AGENT,
        "Accept-Language": "it,en;q=0.8",
      },
      body: JSON.stringify({
        context: INNERTUBE_ANDROID_CONTEXT,
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Aggiunge/forza il formato json3 al baseUrl della traccia. */
function appendJson3(baseUrl: string): string {
  return baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
}

interface PlayerResponse {
  videoDetails?: unknown;
  captions?: {
    playerCaptionsTracklistRenderer?: { captionTracks?: unknown };
  };
}

/**
 * Estrae l'oggetto JSON `ytInitialPlayerResponse` dall'HTML. Pura.
 * Localizza l'assegnazione e fa il parse bilanciando le parentesi graffe (il
 * JSON contiene `}` annidate, quindi una regex greedy non basta).
 */
export function extractPlayerResponse(html: string): PlayerResponse | null {
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
