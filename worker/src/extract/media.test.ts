import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, stat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  parseWhisperResponse,
  transcribe,
  downloadAudio,
  cleanupAudio,
  ytdlpCookieArgs,
  type ProcessRunner,
  type TranscribeFetch,
} from './media.ts';
import type { WorkerEnv } from '../env.ts';

const env: WorkerEnv = {
  supabaseUrl: 'https://x.supabase.co',
  supabaseServiceRoleKey: 'service-role',
  openaiApiKey: 'sk-test',
  pollIntervalMs: 5000,
};

describe('parseWhisperResponse', () => {
  it('estrae e fa il trim del campo text', () => {
    expect(parseWhisperResponse({ text: '  ciao mondo  ' })).toBe('ciao mondo');
  });

  it('accetta testo vuoto (audio senza parlato)', () => {
    expect(parseWhisperResponse({ text: '' })).toBe('');
  });

  it('rifiuta risposte non oggetto', () => {
    expect(() => parseWhisperResponse(null)).toThrow();
    expect(() => parseWhisperResponse('testo')).toThrow();
  });

  it('rifiuta risposte senza campo text valido', () => {
    expect(() => parseWhisperResponse({})).toThrow();
    expect(() => parseWhisperResponse({ text: 42 })).toThrow();
  });
});

describe('transcribe', () => {
  async function tempAudio(bytes: number): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'ib-test-'));
    const path = join(dir, 'audio.m4a');
    await writeFile(path, Buffer.alloc(bytes, 1));
    return path;
  }

  it('invia multipart con auth e ritorna il testo trascritto', async () => {
    const path = await tempAudio(1024);
    let sentAuth: string | undefined;
    let sentModel: unknown = null;
    const fakeFetch: TranscribeFetch = (_url, init) => {
      sentAuth = init.headers.authorization;
      sentModel = init.body.get('model');
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ text: 'trascritto' }),
      });
    };
    const out = await transcribe(path, env, fakeFetch);
    expect(out).toBe('trascritto');
    expect(sentAuth).toBe('Bearer sk-test');
    expect(sentModel).toBe('whisper-1');
  });

  it('lancia su risposta non-2xx senza esporre il corpo', async () => {
    const path = await tempAudio(1024);
    const fakeFetch: TranscribeFetch = () =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'segreto interno' }),
      });
    await expect(transcribe(path, env, fakeFetch)).rejects.toThrow('401');
  });

  it('rifiuta un file audio vuoto', async () => {
    const path = await tempAudio(0);
    const fakeFetch: TranscribeFetch = () => {
      throw new Error('non dovrebbe arrivare qui');
    };
    await expect(transcribe(path, env, fakeFetch)).rejects.toThrow('vuoto');
  });
});

describe('ytdlpCookieArgs', () => {
  it('senza opzioni non aggiunge argomenti (comportamento storico)', () => {
    expect(ytdlpCookieArgs()).toEqual([]);
    expect(ytdlpCookieArgs({})).toEqual([]);
  });

  it('usa il browser quando indicato', () => {
    expect(ytdlpCookieArgs({ cookiesFromBrowser: 'chrome' })).toEqual([
      '--cookies-from-browser',
      'chrome',
    ]);
  });

  it('usa il file cookie quando indicato', () => {
    expect(ytdlpCookieArgs({ cookiesFile: '/tmp/cookies.txt' })).toEqual([
      '--cookies',
      '/tmp/cookies.txt',
    ]);
  });

  it('preferisce il browser al file se entrambi presenti', () => {
    expect(
      ytdlpCookieArgs({ cookiesFromBrowser: 'firefox', cookiesFile: '/c.txt' }),
    ).toEqual(['--cookies-from-browser', 'firefox']);
  });
});

describe('downloadAudio', () => {
  it('esegue yt-dlp poi ffmpeg e ritorna il path normalizzato', async () => {
    const calls: string[] = [];
    const runner: ProcessRunner = async (file, args) => {
      calls.push(file);
      if (file === 'yt-dlp') {
        // Simula il file scaricato che yt-dlp avrebbe prodotto.
        const outIdx = args.indexOf('-o');
        const template = args[outIdx + 1];
        // `dirname` gestisce sia `/` (POSIX) sia `\` (Windows): il template è
        // costruito con path.join, quindi il separatore dipende dalla piattaforma.
        const dir = template ? dirname(template) : undefined;
        if (dir) await writeFile(join(dir, 'raw.webm'), 'audio');
      }
      if (file === 'ffmpeg') {
        const dst = args[args.length - 1];
        if (dst) await writeFile(dst, Buffer.alloc(2048, 1));
      }
      return '';
    };

    const audio = await downloadAudio('https://youtu.be/abc', runner);
    expect(calls).toEqual(['yt-dlp', 'ffmpeg']);
    expect(audio.path.endsWith('audio.m4a')).toBe(true);
    // Il file normalizzato esiste su disco.
    expect((await stat(audio.path)).size).toBeGreaterThan(0);
    await cleanupAudio(audio);
  });

  it('inoltra i cookie a yt-dlp quando configurati (es. TikTok login)', async () => {
    let ytdlpArgs: readonly string[] = [];
    const runner: ProcessRunner = async (file, args) => {
      if (file === 'yt-dlp') {
        ytdlpArgs = args;
        const outIdx = args.indexOf('-o');
        const template = args[outIdx + 1];
        const dir = template ? dirname(template) : undefined;
        if (dir) await writeFile(join(dir, 'raw.webm'), 'audio');
      }
      if (file === 'ffmpeg') {
        const dst = args[args.length - 1];
        if (dst) await writeFile(dst, Buffer.alloc(2048, 1));
      }
      return '';
    };

    const audio = await downloadAudio('https://vm.tiktok.com/abc', runner, {
      cookiesFromBrowser: 'chrome',
    });
    expect(ytdlpArgs).toContain('--cookies-from-browser');
    expect(ytdlpArgs).toContain('chrome');
    await cleanupAudio(audio);
  });

  it('rifiuta URL non http/https (difesa input)', async () => {
    const runner: ProcessRunner = () => {
      throw new Error('non deve eseguire processi');
    };
    await expect(downloadAudio('file:///etc/passwd', runner)).rejects.toThrow();
    await expect(downloadAudio('not a url', runner)).rejects.toThrow();
  });

  it('propaga l\'errore di yt-dlp (es. video privato) e pulisce', async () => {
    const runner: ProcessRunner = (file) => {
      if (file === 'yt-dlp') {
        return Promise.reject(new Error('Video unavailable'));
      }
      return Promise.resolve('');
    };
    await expect(
      downloadAudio('https://youtu.be/private', runner),
    ).rejects.toThrow('Video unavailable');
  });
});

describe('cleanupAudio', () => {
  it('non lancia su null', async () => {
    await expect(cleanupAudio(null)).resolves.toBeUndefined();
  });

  it('rimuove la dir temporanea', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ib-clean-'));
    await mkdir(join(dir, 'sub'), { recursive: true });
    await cleanupAudio({ path: join(dir, 'audio.m4a'), dir });
    await expect(stat(dir)).rejects.toThrow();
  });

  it('non lancia se la dir non esiste (best-effort)', async () => {
    await expect(
      cleanupAudio({ path: '/nope/audio.m4a', dir: '/nope/xyz-inesistente' }),
    ).resolves.toBeUndefined();
  });
});
