import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { processItem, type ProcessDeps } from './index.ts';
import type { WorkerEnv } from './env.ts';
import type { ClaimedItem } from './types.ts';
import type { DownloadedAudio } from './extract/media.ts';

const env: WorkerEnv = {
  supabaseUrl: 'https://x.supabase.co',
  supabaseServiceRoleKey: 'service-role',
  openaiApiKey: 'sk-test',
  pollIntervalMs: 5000,
};

const item: ClaimedItem = {
  id: 'item-1',
  source_url: 'https://www.tiktok.com/@a/video/1',
  source_type: 'tiktok',
  note: 'la mia nota',
  media_stage: 'processing',
};

/** Cattura gli UPDATE su `items` per asserire lo stato finale. */
function fakeSupabase(): {
  client: SupabaseClient;
  updates: Record<string, unknown>[];
} {
  const updates: Record<string, unknown>[] = [];
  const client = {
    from() {
      return {
        update(patch: Record<string, unknown>) {
          updates.push(patch);
          return {
            eq() {
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, updates };
}

const audio: DownloadedAudio = { path: '/tmp/x/audio.m4a', dir: '/tmp/x' };

/** Deps di default per il percorso felice; override per i casi d'errore. */
function makeDeps(over: Partial<ProcessDeps> = {}): {
  deps: ProcessDeps;
  cleaned: DownloadedAudio[];
  generated: string[];
} {
  const cleaned: DownloadedAudio[] = [];
  const generated: string[] = [];
  const deps: ProcessDeps = {
    fetchCaption: () =>
      Promise.resolve({ caption: 'caption', author: '@a' }),
    downloadAudio: () => Promise.resolve(audio),
    transcribe: () => Promise.resolve('parlato trascritto'),
    cleanupAudio: (a) => {
      if (a) cleaned.push(a);
      return Promise.resolve();
    },
    invokeGenerate: (id) => {
      generated.push(id);
      return Promise.resolve({ ok: true, status: 200 });
    },
    ...over,
  };
  return { deps, cleaned, generated };
}

describe('processItem', () => {
  it('successo: salva raw_content etichettato, media_stage=done e chiama generate', async () => {
    const { client, updates } = fakeSupabase();
    const { deps, cleaned, generated } = makeDeps();

    await processItem(client, env, item, deps);

    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ media_stage: 'done', error: null });
    expect(updates[0]?.raw_content).toBe(
      '[Caption] caption\n[Autore] @a\n[Trascrizione] parlato trascritto',
    );
    expect(generated).toEqual(['item-1']);
    expect(cleaned).toEqual([audio]); // pulizia sempre
  });

  it('errore di download: media_stage=error MA chiama comunque generate (§7.7)', async () => {
    const { client, updates } = fakeSupabase();
    const { deps, cleaned, generated } = makeDeps({
      downloadAudio: () => Promise.reject(new Error('Video privato')),
    });

    await processItem(client, env, item, deps);

    expect(updates).toHaveLength(1);
    expect(updates[0]?.media_stage).toBe('error');
    expect(updates[0]?.error).toBe('Video privato');
    expect(updates[0]?.raw_content).toBeUndefined();
    // Il testimone passa a generate anche in errore.
    expect(generated).toEqual(['item-1']);
    // Niente file da pulire (download fallito): cleanup chiamato con null.
    expect(cleaned).toEqual([]);
  });

  it('errore STT dopo download: pulisce l\'audio e chiama generate', async () => {
    const { client, updates } = fakeSupabase();
    const { deps, cleaned, generated } = makeDeps({
      transcribe: () => Promise.reject(new Error('trascrizione fallita (HTTP 500)')),
    });

    await processItem(client, env, item, deps);

    expect(updates[0]?.media_stage).toBe('error');
    expect(cleaned).toEqual([audio]); // l'audio scaricato va comunque pulito
    expect(generated).toEqual(['item-1']);
  });

  it('fonte non gestibile (source_url null): error + generate, niente download', async () => {
    const { client, updates } = fakeSupabase();
    let downloaded = false;
    const { deps, generated } = makeDeps({
      downloadAudio: () => {
        downloaded = true;
        return Promise.resolve(audio);
      },
    });

    await processItem(
      client,
      env,
      { ...item, source_url: null },
      deps,
    );

    expect(downloaded).toBe(false);
    expect(updates[0]?.media_stage).toBe('error');
    expect(generated).toEqual(['item-1']);
  });
});
