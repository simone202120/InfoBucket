// Test per l'instradamento dell'estrazione documenti (testo / PDF / non gestito).
// Esegui con: deno test  (dentro supabase/functions/)

import { assert, assertEquals } from "jsr:@std/assert@1";
import { extractDocument } from "./extract-document.ts";

const enc = new TextEncoder();

Deno.test("extractDocument: testo semplice via MIME type", async () => {
  const res = await extractDocument(enc.encode("Ciao   mondo\n\n\n!"), "text/plain", null);
  assert(res.ok);
  if (res.ok) assertEquals(res.text, "Ciao mondo\n\n!");
});

Deno.test("extractDocument: testo semplice via estensione .md", async () => {
  const res = await extractDocument(enc.encode("# Titolo"), null, "note/appunti.md");
  assert(res.ok);
  if (res.ok) assertEquals(res.text, "# Titolo");
});

Deno.test("extractDocument: testo vuoto → non ok con messaggio", async () => {
  const res = await extractDocument(enc.encode("   "), "text/plain", null);
  assert(!res.ok);
});

Deno.test("extractDocument: formato non gestito → non ok con messaggio utile", async () => {
  const res = await extractDocument(
    enc.encode("PKbinario"),
    "application/zip",
    "archivio.zip",
  );
  assert(!res.ok);
  if (!res.ok) assert(res.reason.toLowerCase().includes("non supportato"));
});

Deno.test("extractDocument: PDF non valido degrada con messaggio (non lancia)", async () => {
  // Byte che non sono un PDF valido: unpdf fallisce → reason, non eccezione.
  const res = await extractDocument(enc.encode("non un pdf"), "application/pdf", "x.pdf");
  assert(!res.ok);
  if (!res.ok) assert(res.reason.toLowerCase().includes("pdf"));
});
