// Test per le utilità di testo (normalizzazione, troncamento, html→testo).
// Esegui con: deno test  (dentro supabase/functions/)

import { assert, assertEquals } from "jsr:@std/assert@1";
import { htmlToText, normalizeWhitespace, truncateChars } from "./text.ts";

Deno.test("normalizeWhitespace collassa spazi e righe vuote, fa trim", () => {
  assertEquals(normalizeWhitespace("  a   b\t c  "), "a b c");
  assertEquals(normalizeWhitespace("riga1\n\n\n\nriga2"), "riga1\n\nriga2");
  assertEquals(normalizeWhitespace("\r\nuno\r\ndue\r\n"), "uno\ndue");
});

Deno.test("truncateChars: idempotente sotto il limite", () => {
  assertEquals(truncateChars("ciao", 10), "ciao");
  assertEquals(truncateChars("", 10), "");
});

Deno.test("truncateChars: taglia all'ultimo spazio entro il limite", () => {
  const text = "uno due tre quattro cinque";
  const out = truncateChars(text, 15);
  assert(out.length <= 15);
  // Non spezza 'quattro' a metà: taglia all'ultimo confine di parola.
  assert(!out.endsWith("quat"));
  assertEquals(out, "uno due tre");
});

Deno.test("truncateChars: testo senza spazi viene comunque tagliato (hard cut)", () => {
  const blob = "x".repeat(100);
  assertEquals(truncateChars(blob, 10).length, 10);
});

Deno.test("truncateChars: limite <= 0 → stringa vuota", () => {
  assertEquals(truncateChars("ciao", 0), "");
  assertEquals(truncateChars("ciao", -5), "");
});

Deno.test("htmlToText: rimuove script/style ed estrae il testo", () => {
  const html = `
    <html><head><style>.a{color:red}</style></head>
    <body>
      <script>alert('x')</script>
      <h1>Titolo</h1>
      <p>Primo paragrafo.</p>
      <p>Secondo &amp; ultimo.</p>
    </body></html>`;
  const text = htmlToText(html);
  assert(!text.includes("alert"));
  assert(!text.includes("color:red"));
  assert(text.includes("Titolo"));
  assert(text.includes("Primo paragrafo."));
  assert(text.includes("Secondo & ultimo."));
});

Deno.test("htmlToText: decodifica entità numeriche e nbsp", () => {
  assertEquals(htmlToText("<p>caff&#232;&nbsp;forte</p>").includes("caffè"), true);
});
