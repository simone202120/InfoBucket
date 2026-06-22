import { describe, it, expect } from 'vitest';
import { loadEnv, MissingEnvError } from './env.ts';

/** Ambiente minimo valido (solo le variabili richieste). */
const base: NodeJS.ProcessEnv = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  OPENAI_API_KEY: 'sk-test',
};

describe('loadEnv', () => {
  it('lancia MissingEnvError elencando le variabili richieste assenti', () => {
    expect(() => loadEnv({})).toThrow(MissingEnvError);
    try {
      loadEnv({});
    } catch (e) {
      expect((e as Error).message).toContain('SUPABASE_URL');
      expect((e as Error).message).toContain('OPENAI_API_KEY');
    }
  });

  it('usa il default per pollIntervalMs e nessun cookie se non configurati', () => {
    const env = loadEnv(base);
    expect(env.pollIntervalMs).toBe(5000);
    expect(env.ytdlpCookiesFromBrowser).toBeUndefined();
    expect(env.ytdlpCookiesFile).toBeUndefined();
  });

  it('legge i cookie da browser e da file', () => {
    const env = loadEnv({
      ...base,
      YTDLP_COOKIES_FROM_BROWSER: 'chrome',
      YTDLP_COOKIES_FILE: '/tmp/cookies.txt',
    });
    expect(env.ytdlpCookiesFromBrowser).toBe('chrome');
    expect(env.ytdlpCookiesFile).toBe('/tmp/cookies.txt');
  });

  it('tratta i cookie vuoti o solo-spazi come assenti', () => {
    const env = loadEnv({ ...base, YTDLP_COOKIES_FROM_BROWSER: '   ' });
    expect(env.ytdlpCookiesFromBrowser).toBeUndefined();
  });
});
