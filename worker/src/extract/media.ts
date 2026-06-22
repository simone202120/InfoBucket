/**
 * Download audio + trascrizione (STT) — il cuore "pesante" del worker (§7.3-7.4).
 *
 * Tutto l'I/O esterno (yt-dlp, ffmpeg, rete) vive qui, dietro firme pure dal
 * punto di vista del chiamante (url → file path → testo), così l'orchestrazione
 * in index.ts resta testabile. I processi esterni e la chiamata HTTP sono
 * iniettabili (`ProcessRunner`, `TranscribeFetch`) per poter unit-testare la
 * logica e la gestione errori SENZA eseguire yt-dlp/ffmpeg/rete reali.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, rm, stat, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WorkerEnv } from '../env.ts';

/** Risultato di un download audio: file prodotto + dir temporanea da pulire. */
export interface DownloadedAudio {
  /** Path assoluto del file audio compatto su disco temporaneo. */
  readonly path: string;
  /** Dir temporanea che contiene il file: la pulizia rimuove l'intera dir. */
  readonly dir: string;
}

/** Eseguito un processo esterno: ritorna stdout, lancia su exit code != 0. */
export type ProcessRunner = (
  file: string,
  args: readonly string[],
  options?: ProcessOptions,
) => Promise<string>;

export interface ProcessOptions {
  /** Timeout in ms: oltre, il processo viene ucciso e si lancia un errore. */
  readonly timeoutMs?: number;
  /** Dimensione massima di stdout in byte (difesa contro output enormi). */
  readonly maxBufferBytes?: number;
}

/** Fetch iniettabile per la chiamata a Whisper (multipart). */
export type TranscribeFetch = (
  url: string,
  init: { headers: Record<string, string>; body: FormData },
) => Promise<TranscribeResponse>;

export interface TranscribeResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

// --- Costanti di estrazione (niente magic number sparsi). ---

/** Timeout download yt-dlp: i video brevi sono leggeri, ma la rete può bloccarsi. */
const DOWNLOAD_TIMEOUT_MS = 120_000;
/** Timeout transcodifica ffmpeg: opera su un file locale già scaricato. */
const FFMPEG_TIMEOUT_MS = 60_000;
/** Tetto di stdout dei processi: i metadati testuali stanno ampiamente sotto. */
const PROCESS_MAX_BUFFER = 16 * 1024 * 1024;
/**
 * Limite di upload a Whisper. L'API OpenAI rifiuta file > 25 MB; con audio mono
 * 16 kHz a basso bitrate (~32 kbps) servono ~100 min per arrivarci, quindi è un
 * margine di sicurezza, non un caso comune. Lo verifichiamo prima dell'upload
 * per dare un errore chiaro invece di un 413 opaco.
 */
const WHISPER_MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const TRANSCRIBE_URL = 'https://api.openai.com/v1/audio/transcriptions';
const WHISPER_MODEL = 'whisper-1';
/** Nome base del file audio normalizzato dentro la dir temporanea. */
const AUDIO_FILENAME = 'audio.m4a';

/** Runner di default: execFile (NON shell → niente injection da `url`). */
const defaultRunner: ProcessRunner = (file, args, options) =>
  new Promise<string>((resolve, reject) => {
    execFile(
      file,
      [...args],
      {
        timeout: options?.timeoutMs,
        maxBuffer: options?.maxBufferBytes ?? PROCESS_MAX_BUFFER,
        // Non ereditare lo stdin; nessuna shell.
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          // Messaggio compatto: niente segreti (qui non ce ne sono) e niente
          // dump completo di stderr nei log a monte. Diamo solo l'essenziale.
          const detail = firstLine(stderr) || error.message;
          reject(new Error(`${file} fallito: ${detail}`));
          return;
        }
        resolve(stdout);
      },
    );
  });

/** Solo l'URL http/https è accettato come fonte (difesa input remoto, §5). */
function assertHttpUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('URL fonte non valido');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL fonte non http/https');
  }
}

/**
 * Scarica lo stream della fonte e ne estrae una traccia audio compatta
 * (mono 16 kHz, basso bitrate) adatta allo STT: file piccolo, upload veloce (§7.3).
 *
 *  - `yt-dlp -f bestaudio` scarica SOLO l'audio (niente video → meno banda/disco).
 *  - `ffmpeg -ac 1 -ar 16000 -b:a 32k` normalizza a mono 16 kHz: Whisper lavora
 *    bene così e il file resta minimo.
 *  - Tutto in una dir temporanea per item, così la pulizia (rm della dir) è
 *    atomica indipendentemente dall'estensione scaricata.
 *
 * @throws con messaggio chiaro se download/estrazione falliscono (video privato,
 *   rimosso, geo-block, ecc.): index.ts lo propaga su `items.error` (§7.7).
 */
export async function downloadAudio(
  url: string,
  runner: ProcessRunner = defaultRunner,
): Promise<DownloadedAudio> {
  assertHttpUrl(url);

  const dir = await mkdtemp(join(tmpdir(), 'infobucket-'));
  try {
    // yt-dlp scrive l'audio grezzo; l'estensione la decide lui (%(ext)s).
    const rawTemplate = join(dir, 'raw.%(ext)s');
    await runner(
      'yt-dlp',
      [
        '--no-playlist',
        '--no-warnings',
        '-f',
        'bestaudio/best',
        '-o',
        rawTemplate,
        url,
      ],
      { timeoutMs: DOWNLOAD_TIMEOUT_MS },
    );

    // yt-dlp sceglie l'estensione (%(ext)s): individuiamo il file `raw.*` reale e
    // lo ricomprimiamo a mono 16 kHz con ffmpeg.
    const rawPath = await findRawFile(dir);
    const audioPath = join(dir, AUDIO_FILENAME);
    await runner(
      'ffmpeg',
      [
        '-y',
        '-i',
        rawPath,
        '-vn', // scarta eventuale traccia video residua
        '-ac',
        '1', // mono
        '-ar',
        '16000', // 16 kHz
        '-b:a',
        '32k', // basso bitrate
        audioPath,
      ],
      { timeoutMs: FFMPEG_TIMEOUT_MS },
    );

    return { path: audioPath, dir };
  } catch (err) {
    // Pulisci la dir parziale prima di propagare: non lasciamo spazzatura.
    await safeRemove(dir);
    throw err;
  }
}

/** Trova il file `raw.*` prodotto da yt-dlp nella dir temporanea. */
async function findRawFile(dir: string): Promise<string> {
  const entries = await readdir(dir);
  const raw = entries.find((name) => name.startsWith('raw.'));
  if (!raw) throw new Error('yt-dlp non ha prodotto un file audio');
  return join(dir, raw);
}

/**
 * Trascrive un file audio con OpenAI Whisper (`whisper-1`) → testo del parlato.
 * Riusa la STESSA `OPENAI_API_KEY` degli embedding: nessuna terza chiave (§4).
 *
 *  - POST multipart a /v1/audio/transcriptions con `model=whisper-1` e il file.
 *  - Non logga mai la chiave né l'audio; le risposte non-2xx diventano errori
 *    senza esporre il corpo grezzo.
 *
 * @returns testo trascritto (può essere stringa vuota se l'audio non ha parlato).
 */
export async function transcribe(
  audioPath: string,
  env: WorkerEnv,
  fetcher: TranscribeFetch = defaultTranscribeFetch,
): Promise<string> {
  const size = (await stat(audioPath)).size;
  if (size === 0) throw new Error('file audio vuoto');
  if (size > WHISPER_MAX_AUDIO_BYTES) {
    throw new Error('audio troppo grande per la trascrizione');
  }

  const bytes = await readFile(audioPath);
  const form = new FormData();
  form.append('model', WHISPER_MODEL);
  // `response_format=text` → la risposta è testo puro; usiamo json per uniformità
  // di parsing dell'errore, leggendo `text` dal corpo.
  form.append('file', new Blob([bytes]), AUDIO_FILENAME);

  const res = await fetcher(TRANSCRIBE_URL, {
    headers: { authorization: `Bearer ${env.openaiApiKey}` },
    body: form,
  });

  if (!res.ok) {
    // Non esponiamo il corpo: può contenere dettagli interni. Solo lo status.
    throw new Error(`trascrizione fallita (HTTP ${res.status})`);
  }

  return parseWhisperResponse(await res.json());
}

/**
 * Estrae il testo dalla risposta di Whisper. PURA e testabile: l'API restituisce
 * `{ text: "..." }`; validiamo perché è output remoto non fidato.
 */
export function parseWhisperResponse(body: unknown): string {
  if (body === null || typeof body !== 'object') {
    throw new Error('risposta di trascrizione non valida');
  }
  const text = (body as Record<string, unknown>).text;
  if (typeof text !== 'string') {
    throw new Error('risposta di trascrizione senza campo text');
  }
  return text.trim();
}

/** Fetch di default per Whisper: usa il `fetch` nativo di Node 22. */
const defaultTranscribeFetch: TranscribeFetch = (url, init) =>
  fetch(url, { method: 'POST', headers: init.headers, body: init.body });

/**
 * Rimuove la dir temporanea prodotta da `downloadAudio` (§7.6).
 * Best-effort: un fallimento di pulizia non deve far fallire la pipeline.
 */
export async function cleanupAudio(audio: DownloadedAudio | null): Promise<void> {
  if (!audio) return;
  await safeRemove(audio.dir);
}

/** rm ricorsivo che non lancia mai (no-throw, §7.6). */
async function safeRemove(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {
    // Pulizia best-effort: ignoriamo (il SO ripulisce comunque /tmp).
  }
}

/** Prima riga non vuota di un testo (per messaggi d'errore compatti). */
function firstLine(text: string): string {
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t !== '') return t;
  }
  return '';
}
