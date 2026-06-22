/**
 * Download audio + trascrizione (STT) — il cuore "pesante" del worker (§7.3-7.4).
 *
 * Questo file è SCAFFOLD: firme e contratti reali, implementazione in Fase 6.
 * Tutto l'I/O esterno (yt-dlp, ffmpeg, rete) vive qui, dietro firme pure dal
 * punto di vista del chiamante (in → file path → testo), così l'orchestrazione
 * in index.ts resta testabile.
 */
import type { WorkerEnv } from '../env.ts';

/** Risultato di un download audio: percorso del file temporaneo prodotto. */
export interface DownloadedAudio {
  /** Path assoluto del file audio compatto su disco temporaneo. */
  path: string;
}

/**
 * Scarica lo stream della fonte e ne estrae una traccia audio compatta
 * (mono, basso bitrate) adatta allo STT: file piccolo, upload veloce (§7.3).
 *
 * TODO Fase 6:
 *  - `yt-dlp -f bestaudio --no-playlist -o <tmp>/<id>.%(ext)s <url>` per scaricare
 *    solo l'audio (niente video → meno banda/disco).
 *  - `ffmpeg -i <in> -ac 1 -ar 16000 -b:a 32k <tmp>/<id>.m4a` per normalizzare a
 *    mono 16kHz basso bitrate (Whisper lavora bene così, file minimo).
 *  - Eseguirli con `node:child_process` (execFile, NON shell, per evitare
 *    injection da `url`); validare che `url` sia http/https prima di passarlo.
 *  - Usare una working dir temporanea per item (es. os.tmpdir()/<item.id>), così
 *    la pulizia (rm -rf della dir) è atomica indipendentemente dall'estensione.
 *  - Mappare i fallimenti noti (video privato/rimosso, geo-block) a errori chiari
 *    per il chiamante, che li propagherà su `items.error`.
 *
 * @throws in caso di download/estrazione fallita (gestito da index.ts → §7.7).
 */
export async function downloadAudio(url: string): Promise<DownloadedAudio> {
  // TODO Fase 6: implementare yt-dlp + ffmpeg.
  void url;
  throw new Error('downloadAudio non ancora implementato (Fase 6)');
}

/**
 * Trascrive un file audio con OpenAI Whisper (`whisper-1`) → testo del parlato.
 * Riusa la STESSA `OPENAI_API_KEY` degli embedding: nessuna terza chiave (§4).
 *
 * TODO Fase 6:
 *  - POST multipart a `https://api.openai.com/v1/audio/transcriptions`
 *    con `Authorization: Bearer ${env.openaiApiKey}`, campo `model=whisper-1`,
 *    `file=<stream del path>`, opzionale `language` se nota.
 *  - Usare `fetch` con `FormData`/`Blob` da `node:fs` (Node 22 ha fetch nativo).
 *  - Restituire `response.text`; non loggare mai la chiave né l'audio.
 *  - Gestire risposte non-2xx come errori (senza esporre il corpo grezzo).
 *
 * @returns testo trascritto (può essere stringa vuota se l'audio non ha parlato).
 */
export async function transcribe(audioPath: string, env: WorkerEnv): Promise<string> {
  // TODO Fase 6: implementare chiamata a Whisper. `env` porta la OPENAI_API_KEY.
  void audioPath;
  void env;
  throw new Error('transcribe non ancora implementato (Fase 6)');
}

/**
 * Rimuove il file/dir temporaneo prodotto da `downloadAudio` (§7.6).
 * Best-effort: un fallimento di pulizia non deve far fallire la pipeline.
 *
 * TODO Fase 6: `fs.rm(path, { force: true })` (o della dir temporanea per item).
 */
export async function cleanupAudio(audio: DownloadedAudio | null): Promise<void> {
  if (!audio) return;
  // TODO Fase 6: rimuovere audio.path dal disco temporaneo.
  void audio;
}
