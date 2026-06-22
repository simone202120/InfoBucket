/**
 * Entry point del worker: loop di polling per l'estrazione media (§7).
 *
 * Ciclo: claim atomico di un item `media_stage='pending'` → orchestrazione delle
 * fasi (caption → audio → STT → raw_content) → `generate`. In caso di errore
 * l'item va in `media_stage='error'` MA `generate` viene chiamata lo stesso
 * (§7.7): caption + nota bastano spesso per un riassunto utile.
 *
 * Nessuna porta aperta: solo connessioni in uscita verso Supabase e le API (§3).
 */
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadEnv, type WorkerEnv } from './env.ts';
import { createSupabase } from './supabase.ts';
import {
  fetchCaptionMetadata,
  type Fetcher,
  type MetadataDumper,
} from './extract/caption.ts';
import {
  downloadAudio,
  transcribe,
  cleanupAudio,
  type DownloadedAudio,
} from './extract/media.ts';
import { composeRawContent } from './rawContent.ts';
import { invokeGenerate, type InvokeGenerateResult } from './generate.ts';
import type { CaptionMetadata, ClaimedItem, MediaSourceType } from './types.ts';

/** Colonne minime necessarie al worker (vedi types.ts). */
const ITEM_COLUMNS = 'id, source_url, source_type, note, media_stage';

/**
 * Claim atomico: porta UN item da `pending` a `processing` impostando
 * `worker_claimed_at`. Il filtro `eq('media_stage','pending')` nell'UPDATE
 * garantisce che due worker non prendano lo stesso item (chi perde la corsa
 * non trova più la riga `pending`); `select().limit(1)` realizza il
 * "update ... where ... returning" della §7.1. Restituisce null se la coda è
 * vuota.
 */
export async function claimNext(
  supabase: SupabaseClient,
): Promise<ClaimedItem | null> {
  // 1. Trova un candidato pending (l'indice parziale idx_items_media_queue lo
  //    rende economico). Lo stato autorevole è comunque riverificato nell'UPDATE.
  const candidate = await supabase
    .from('items')
    .select('id')
    .eq('media_stage', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (candidate.error) throw candidate.error;
  if (!candidate.data) return null;

  // 2. UPDATE condizionato: vince solo se la riga è ANCORA pending. Il returning
  //    (select) ci dà la riga solo a chi ha effettivamente fatto la transizione.
  const claimed = await supabase
    .from('items')
    .update({
      media_stage: 'processing',
      worker_claimed_at: new Date().toISOString(),
    })
    .eq('id', candidate.data.id)
    .eq('media_stage', 'pending')
    .select(ITEM_COLUMNS)
    .maybeSingle();

  if (claimed.error) throw claimed.error;
  // null = un altro worker l'ha preso tra (1) e (2): semplicemente riprova dopo.
  return (claimed.data as ClaimedItem | null) ?? null;
}

/** Timeout della fetch caption (oEmbed/Open Graph): risorse leggere e opzionali. */
const CAPTION_FETCH_TIMEOUT_MS = 15_000;
/** Timeout di `yt-dlp --dump-json` per i metadati YouTube. */
const METADATA_DUMP_TIMEOUT_MS = 30_000;

/** Fetch HTTP testuale con timeout per i parser caption. */
const httpFetcher: Fetcher = async (url) => {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(CAPTION_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.text();
};

/** Metadati YouTube via `yt-dlp --dump-json` (niente download dello stream). */
const dumpMetadata: MetadataDumper = (url) =>
  new Promise<string>((resolve, reject) => {
    execFile(
      'yt-dlp',
      ['--no-playlist', '--no-warnings', '--skip-download', '--dump-json', url],
      { timeout: METADATA_DUMP_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(new Error('yt-dlp --dump-json fallito'));
          return;
        }
        resolve(stdout);
      },
    );
  });

/**
 * Dipendenze di estrazione iniettabili: in produzione sono le funzioni reali
 * (yt-dlp/ffmpeg/Whisper/HTTP), nei test sono stub. Così `processItem` orchestra
 * senza conoscere l'I/O concreto (CLAUDE.md §6 — I/O mockato).
 */
export interface ProcessDeps {
  fetchCaption(
    type: MediaSourceType,
    url: string,
  ): Promise<CaptionMetadata>;
  downloadAudio(url: string): Promise<DownloadedAudio>;
  transcribe(audioPath: string, env: WorkerEnv): Promise<string>;
  cleanupAudio(audio: DownloadedAudio | null): Promise<void>;
  invokeGenerate(itemId: string, env: WorkerEnv): Promise<InvokeGenerateResult>;
}

/** Implementazione di produzione delle dipendenze di estrazione. */
const productionDeps: ProcessDeps = {
  fetchCaption: (type, url) =>
    fetchCaptionMetadata(type, url, { fetcher: httpFetcher, dumpMetadata }),
  downloadAudio: (url) => downloadAudio(url),
  transcribe: (audioPath, env) => transcribe(audioPath, env),
  cleanupAudio,
  invokeGenerate,
};

function isMediaSourceType(t: string): t is MediaSourceType {
  return t === 'reel' || t === 'tiktok' || t === 'youtube';
}

/**
 * Orchestra l'estrazione per un item già claimato. Persiste `raw_content` e
 * porta `media_stage` a `done` (successo) o `error` (fallimento), poi richiede
 * sempre `generate`. Non lancia: incapsula gli errori nello stato dell'item,
 * così il loop prosegue e l'item non sparisce mai (CLAUDE.md §4).
 */
export async function processItem(
  supabase: SupabaseClient,
  env: WorkerEnv,
  item: ClaimedItem,
  deps: ProcessDeps = productionDeps,
): Promise<void> {
  let audio: DownloadedAudio | null = null;
  try {
    if (!item.source_url || !isMediaSourceType(item.source_type)) {
      throw new Error(`item ${item.id}: fonte non gestibile dal worker`);
    }

    // 1. Caption / metadati leggeri (best-effort, degrada a null).
    const meta = await deps.fetchCaption(item.source_type, item.source_url);

    // 2-3. Download audio + trascrizione (pesante).
    audio = await deps.downloadAudio(item.source_url);
    const transcript = await deps.transcribe(audio.path, env);

    // 4. Componi e persisti il raw_content etichettato (§7.5).
    const rawContent = composeRawContent({
      caption: meta.caption,
      author: meta.author,
      transcript,
    });

    await updateItem(supabase, item.id, {
      raw_content: rawContent,
      media_stage: 'done',
      error: null,
    });
  } catch (err) {
    // §7.7: errore di estrazione → media_stage='error' + messaggio, MA si chiama
    // comunque generate (caption + nota possono bastare).
    await updateItem(supabase, item.id, {
      media_stage: 'error',
      error: toSafeErrorMessage(err),
    });
  } finally {
    // §7.6: pulizia del file temporaneo, sempre.
    await deps.cleanupAudio(audio);
  }

  // §7.6/§7.7: passa il testimone a generate in OGNI caso.
  const result = await deps.invokeGenerate(item.id, env);
  if (!result.ok) {
    console.error(`generate ha risposto ${result.status} per item ${item.id}`);
  }
}

interface ItemUpdate {
  raw_content?: string;
  media_stage?: 'done' | 'error';
  error?: string | null;
}

async function updateItem(
  supabase: SupabaseClient,
  id: string,
  patch: ItemUpdate,
): Promise<void> {
  const { error } = await supabase.from('items').update(patch).eq('id', id);
  if (error) throw error;
}

/** Messaggio d'errore sicuro: niente stack/segreti, solo testo breve (§4). */
function toSafeErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : 'Errore di estrazione media';
  return msg.slice(0, 500);
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Loop principale. Claima e processa un item alla volta; quando la coda è vuota
 * attende `pollIntervalMs`. Gli errori imprevisti del claim non abbattono il
 * processo: si logga e si riprova dopo l'intervallo.
 */
export async function runLoop(
  supabase: SupabaseClient,
  env: WorkerEnv,
  signal?: AbortSignal,
): Promise<void> {
  while (!signal?.aborted) {
    try {
      const item = await claimNext(supabase);
      if (item) {
        await processItem(supabase, env, item);
        continue; // svuota la coda senza pause finché ci sono item.
      }
    } catch (err) {
      console.error('Errore nel loop di polling:', toSafeErrorMessage(err));
    }
    await sleep(env.pollIntervalMs);
  }
}

async function main(): Promise<void> {
  const env = loadEnv();
  const supabase = createSupabase(env);

  const controller = new AbortController();
  const shutdown = (sig: string): void => {
    console.log(`Ricevuto ${sig}, arresto del worker…`);
    controller.abort();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log(`Worker avviato (poll ogni ${env.pollIntervalMs}ms).`);
  await runLoop(supabase, env, controller.signal);
  console.log('Worker arrestato.');
}

// Avvia solo se eseguito direttamente (non quando importato dai test).
// `pathToFileURL` normalizza il path di argv[1] nello stesso formato di
// `import.meta.url` (file:///, slash in avanti) su ogni piattaforma: il
// confronto stringa grezzo `file://${argv[1]}` fallirebbe su Windows, dove
// argv usa i backslash, lasciando il worker senza avviare main().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    // Errore fatale all'avvio (tipicamente env mancante): esci con codice != 0.
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
