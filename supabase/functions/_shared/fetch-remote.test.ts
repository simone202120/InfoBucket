// Test per il fetch difensivo (timeout, limite dimensione, stato) con fetcher mock.
// Esegui con: deno test  (dentro supabase/functions/)

import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import { fetchBytes, FetchError, fetchText, type Fetcher } from "./fetch-remote.ts";

/** Costruisce un fetcher mock che ritorna i byte dati con uno status. */
function mockFetcher(body: Uint8Array, init?: ResponseInit): Fetcher {
  return () => Promise.resolve(new Response(body, init));
}

const enc = new TextEncoder();

Deno.test("fetchText: decodifica il corpo come UTF-8", async () => {
  const f = mockFetcher(enc.encode("ciao mondo"), {
    headers: { "content-type": "text/html" },
  });
  assertEquals(await fetchText("https://x", undefined, f), "ciao mondo");
});

Deno.test("fetchBytes: stato non-2xx → FetchError", async () => {
  const f = mockFetcher(enc.encode(""), { status: 404 });
  await assertRejects(
    () => fetchBytes("https://x", undefined, f),
    FetchError,
  );
});

Deno.test("fetchBytes: supera maxBytes → FetchError", async () => {
  const big = new Uint8Array(1024);
  const f = mockFetcher(big);
  await assertRejects(
    () =>
      fetchBytes(
        "https://x",
        { timeoutMs: 1000, maxBytes: 100, userAgent: "test" },
        f,
      ),
    FetchError,
  );
});

Deno.test("fetchBytes: errore di rete → FetchError generico (no leak)", async () => {
  const f: Fetcher = () => Promise.reject(new Error("dettaglio interno segreto"));
  const err = await fetchBytes("https://x", undefined, f).catch((e) => e);
  assert(err instanceof FetchError);
  // Il messaggio non deve esporre il dettaglio interno.
  assert(!(err as FetchError).message.includes("segreto"));
});

Deno.test("fetchBytes: ritorna i byte e il content-type", async () => {
  const f = mockFetcher(enc.encode("abc"), {
    headers: { "content-type": "application/pdf" },
  });
  const { bytes, contentType } = await fetchBytes("https://x", undefined, f);
  assertEquals(bytes.length, 3);
  assertEquals(contentType, "application/pdf");
});
