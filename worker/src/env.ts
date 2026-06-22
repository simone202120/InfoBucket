/**
 * Caricamento e validazione delle variabili d'ambiente del worker.
 * Le chiavi/segreti vivono SOLO qui (env del servizio), mai nel repo né nel
 * client. Vedi infobucket-spec.md §14 e CLAUDE.md §3.
 *
 * Fallisce subito (fail-fast) con un messaggio chiaro se manca una variabile
 * richiesta: meglio non avviare il loop che lavorare con configurazione parziale.
 */

/** Errore di configurazione: una variabile richiesta manca o è vuota. */
export class MissingEnvError extends Error {
  constructor(names: readonly string[]) {
    super(
      `Variabili d'ambiente mancanti: ${names.join(', ')}. ` +
        'Copia worker/.env.example in worker/.env e compilala.',
    );
    this.name = 'MissingEnvError';
  }
}

export interface WorkerEnv {
  /** URL del progetto Supabase. */
  readonly supabaseUrl: string;
  /** Service role key: scritture di pipeline lato server. MAI nel client. */
  readonly supabaseServiceRoleKey: string;
  /** Chiave OpenAI, usata SOLO per Whisper STT (la stessa degli embedding, §4). */
  readonly openaiApiKey: string;
  /** Intervallo di polling in ms tra un claim e il successivo (default 5000). */
  readonly pollIntervalMs: number;
  /**
   * Browser da cui yt-dlp legge i cookie (es. 'chrome', 'firefox', 'edge') per le
   * fonti che richiedono login, come TikTok. Pensato per l'uso in locale, dove il
   * browser è loggato. `undefined` = nessun cookie. Vedi [[tiktok-needs-login]].
   */
  readonly ytdlpCookiesFromBrowser?: string;
  /**
   * Path a un file cookie in formato Netscape per yt-dlp: alternativa portabile al
   * browser (utile in Docker, dove non c'è un browser loggato). Ha priorità più
   * bassa di `ytdlpCookiesFromBrowser`. `undefined` = nessun cookie.
   */
  readonly ytdlpCookiesFile?: string;
}

/** Numero positivo da stringa, con fallback se assente o non valido. */
function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Legge e valida l'ambiente. Iniettabile (`source`) per testabilità: di default
 * usa `process.env`. Non logga mai i valori delle chiavi.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): WorkerEnv {
  const supabaseUrl = source.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = source.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const openaiApiKey = source.OPENAI_API_KEY?.trim();

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!openaiApiKey) missing.push('OPENAI_API_KEY');
  if (missing.length > 0) throw new MissingEnvError(missing);

  return {
    // I `!` sono sicuri: `missing` sarebbe non vuoto e avremmo già lanciato.
    supabaseUrl: supabaseUrl!,
    supabaseServiceRoleKey: supabaseServiceRoleKey!,
    openaiApiKey: openaiApiKey!,
    pollIntervalMs: parsePositiveInt(source.POLL_INTERVAL_MS, 5000),
    // Cookie opzionali: stringa vuota o assente → undefined (nessuna autenticazione).
    ytdlpCookiesFromBrowser: source.YTDLP_COOKIES_FROM_BROWSER?.trim() || undefined,
    ytdlpCookiesFile: source.YTDLP_COOKIES_FILE?.trim() || undefined,
  };
}
