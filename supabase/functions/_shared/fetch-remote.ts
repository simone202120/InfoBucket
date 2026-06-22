// fetch-remote.ts — Fetch difensivo di risorse remote non fidate (CLAUDE.md §5).
//
// Le fonti remote (pagine articolo, file di Storage, pagine YouTube) NON sono
// fidate: applichiamo SEMPRE timeout, limite di dimensione e User-Agent esplicito,
// e non seguiamo redirect all'infinito. Funzioni piccole e riusabili, niente I/O
// nascosto: il fetcher è iniettabile per i test.

/** Fetcher iniettabile (default: globalThis.fetch). Serve a mockare la rete nei test. */
export type Fetcher = typeof fetch;

export interface FetchLimits {
  /** Timeout totale in millisecondi. */
  timeoutMs: number;
  /** Dimensione massima del corpo scaricato, in byte. */
  maxBytes: number;
  /** User-Agent da inviare (i siti spesso bloccano UA assenti/sospetti). */
  userAgent: string;
}

export const DEFAULT_LIMITS: FetchLimits = {
  timeoutMs: 15_000,
  maxBytes: 8 * 1024 * 1024, // 8 MiB: abbondante per una pagina HTML.
  userAgent:
    "Mozilla/5.0 (compatible; InfoBucketBot/1.0; +https://github.com/infobucket)",
};

export class FetchError extends Error {}

/**
 * Scarica una risorsa applicando timeout e limite di dimensione, e ritorna i
 * byte grezzi. Lancia FetchError (con messaggio utile, senza dettagli sensibili)
 * su timeout, stato non-2xx o superamento del limite.
 *
 * Lo streaming del corpo permette di interrompere appena si supera maxBytes,
 * senza bufferizzare download ostili di dimensioni arbitrarie.
 */
export async function fetchBytes(
  url: string,
  limits: FetchLimits = DEFAULT_LIMITS,
  fetcher: Fetcher = fetch,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limits.timeoutMs);
  try {
    const res = await fetcher(url, {
      method: "GET",
      redirect: "follow", // fetch limita già i redirect a una catena finita.
      signal: controller.signal,
      headers: { "User-Agent": limits.userAgent, "Accept": "*/*" },
    });

    if (!res.ok) {
      throw new FetchError(`Risposta remota non valida (HTTP ${res.status})`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    const bytes = await readCapped(res, limits.maxBytes);
    return { bytes, contentType };
  } catch (e) {
    if (e instanceof FetchError) throw e;
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new FetchError(`Timeout dopo ${limits.timeoutMs} ms`);
    }
    throw new FetchError("Download della risorsa remota fallito");
  } finally {
    clearTimeout(timer);
  }
}

/** Come fetchBytes ma decodifica come UTF-8 (per HTML/testo). */
export async function fetchText(
  url: string,
  limits: FetchLimits = DEFAULT_LIMITS,
  fetcher: Fetcher = fetch,
): Promise<string> {
  const { bytes } = await fetchBytes(url, limits, fetcher);
  return new TextDecoder("utf-8").decode(bytes);
}

/** Legge il corpo della risposta interrompendosi se supera maxBytes. */
async function readCapped(res: Response, maxBytes: number): Promise<Uint8Array> {
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      throw new FetchError(`Risorsa troppo grande (> ${maxBytes} byte)`);
    }
    return buf;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new FetchError(`Risorsa troppo grande (> ${maxBytes} byte)`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
