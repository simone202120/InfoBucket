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
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadEnv, type WorkerEnv } from './env.ts';
import { createSupabase } from './supabase.ts';
import {
  fetchCaptionMetadata,
  type Fetcher,
} from './extract/caption.ts';
import {
  downloadAudio,
  transcribe,
  cleanupAudio,
  type DownloadedAudio,
} from './extract/media.ts';
import { composeRawContent } from './rawContent.ts';
import { invokeGenerate } from './generate.ts';
import type { ClaimedItem, MediaSourceType } from './types.ts';

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

/** Fetch HTTP testuale per i parser caption. Iniettabile nei test. */
const httpFetcher: Fetcher = async (url) => {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.text();
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
): Promise<void> {
  let audio: DownloadedAudio | null = null;
  try {
    if (!item.source_url || !isMediaSourceType(item.source_type)) {
      throw new Error(`item ${item.id}: fonte non gestibile dal worker`);
    }

    // 1. Caption / metadati leggeri (best-effort, degrada a null).
    const meta = await fetchCaptionMetadata(
      item.source_type,
      item.source_url,
      httpFetcher,
    );

    // 2-3. Download audio + trascrizione (pesante).
    audio = await downloadAudio(item.source_url);
    const transcript = await transcribe(audio.path, env);

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
    await cleanupAudio(audio);
  }

  // §7.6/§7.7: passa il testimone a generate in OGNI caso.
  const result = await invokeGenerate(item.id, env);
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
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    // Errore fatale all'avvio (tipicamente env mancante): esci con codice != 0.
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
