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
import { fetchCaptionMetadata, type Fetcher } from './extract/caption.ts';
import {
  downloadAudio,
  transcribe,
  cleanupAudio,
  ytdlpCookieArgs,
  type DownloadedAudio,
  type YtdlpCookieOptions,
} from './extract/media.ts';
import { composeRawContent } from './rawContent.ts';
import { invokeGenerate, type InvokeGenerateResult } from './generate.ts';
import type {
  CaptionMetadata,
  ClaimedItem,
  ItemStatus,
  MediaSourceType,
} from './types.ts';

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
function dumpMetadata(url: string, cookies?: YtdlpCookieOptions): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    execFile(
      'yt-dlp',
      [
        '--no-playlist',
        '--no-warnings',
        ...ytdlpCookieArgs(cookies),
        '--skip-download',
        '--dump-json',
        url,
      ],
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
}

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

/** Estrae le opzioni cookie di yt-dlp dall'ambiente del worker. */
function cookieOptions(env: WorkerEnv): YtdlpCookieOptions {
  return {
    cookiesFromBrowser: env.ytdlpCookiesFromBrowser,
    cookiesFile: env.ytdlpCookiesFile,
  };
}

/**
 * Implementazione di produzione delle dipendenze di estrazione. È una factory
 * (non una const) perché i cookie yt-dlp arrivano dall'ambiente: vanno catturati
 * in chiusura e propagati a `downloadAudio` e ai metadati YouTube.
 */
export function createProductionDeps(env: WorkerEnv): ProcessDeps {
  const cookies = cookieOptions(env);
  return {
    fetchCaption: (type, url) =>
      fetchCaptionMetadata(type, url, {
        fetcher: httpFetcher,
        dumpMetadata: (u) => dumpMetadata(u, cookies),
      }),
    downloadAudio: (url) => downloadAudio(url, undefined, cookies),
    transcribe,
    cleanupAudio,
    invokeGenerate,
  };
}

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
  deps: ProcessDeps = createProductionDeps(env),
): Promise<void> {
  let audio: DownloadedAudio | null = null;

  if (!item.source_url || !isMediaSourceType(item.source_type)) {
    // Fonte non gestibile: nessuna caption da salvare, solo l'errore.
    const message = `item ${item.id}: fonte non gestibile dal worker`;
    console.error(`Estrazione media fallita (${message})`);
    await updateItem(supabase, item.id, { media_stage: 'error', error: message });
  } else {
    // 1. Caption / metadati leggeri (best-effort: fetchCaption degrada a EMPTY su
    //    errore). La recuperiamo PRIMA del download pesante e fuori dal try, così
    //    sopravvive anche se audio/STT falliscono (degradazione graziosa, §7.7).
    const meta = await deps.fetchCaption(item.source_type, item.source_url);
    try {
      // 2-3. Download audio + trascrizione (pesante).
      audio = await deps.downloadAudio(item.source_url);
      const transcript = await deps.transcribe(audio.path, env);

      // 4. Successo: raw_content = caption + autore + trascrizione (§7.5).
      await updateItem(supabase, item.id, {
        raw_content: composeRawContent({
          caption: meta.caption,
          author: meta.author,
          transcript,
        }),
        media_stage: 'done',
        error: null,
      });
    } catch (err) {
      const message = toSafeErrorMessage(err);
      console.error(`Estrazione media fallita (item ${item.id}): ${message}`);
      // §7.7: l'audio è fallito (es. "TikTok richiede login"), ma la caption
      // recuperata al passo 1 NON va persa: la salviamo lo stesso così `generate`
      // produce un riassunto vero invece di "nessun dato". Solo la trascrizione
      // manca; `composeRawContent` omette la sezione vuota.
      await updateItem(supabase, item.id, {
        raw_content: composeRawContent({
          caption: meta.caption,
          author: meta.author,
        }),
        media_stage: 'error',
        error: message,
      });
    } finally {
      // §7.6: pulizia del file temporaneo, sempre.
      await deps.cleanupAudio(audio);
    }
  }

  // Rigenera con il raw_content arricchito, MA solo se l'utente non ha già
  // confermato l'item: `dispatch` ha già prodotto un riassunto dalla caption per
  // tiktok/reel, quindi il worker QUI è un arricchimento (aggiunge la trascrizione).
  // Rieseguire generate su un item 'saved'/'archived' lo riporterebbe a 'ready'
  // sovrascrivendo le scelte dell'utente (human-in-the-loop, §1) — è anche lo stato
  // incoerente `saved`+`processing` osservato. Lo status si rilegge fresco perché
  // l'utente può aver confermato durante il download lento.
  if (await isConfirmed(supabase, item.id)) {
    console.log(`item ${item.id} già confermato: salto la rigenerazione.`);
    return;
  }

  const result = await deps.invokeGenerate(item.id, env);
  if (!result.ok) {
    console.error(`generate ha risposto ${result.status} per item ${item.id}`);
  }
}

/** True se l'item è stato confermato dall'utente (saved) o archiviato. */
async function isConfirmed(
  supabase: SupabaseClient,
  id: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('items')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  const status = (data as { status?: ItemStatus } | null)?.status;
  return status === 'saved' || status === 'archived';
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
  deps: ProcessDeps = createProductionDeps(env),
): Promise<void> {
  while (!signal?.aborted) {
    try {
      const item = await claimNext(supabase);
      if (item) {
        await processItem(supabase, env, item, deps);
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
