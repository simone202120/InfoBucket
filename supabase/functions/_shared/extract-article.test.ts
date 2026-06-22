// Test per l'estrazione articolo (readability con fallback a strip HTML).
// Esegui con: deno test  (dentro supabase/functions/)
//
// Nota: questi test importano @mozilla/readability + linkedom via npm specifier;
// `deno test` li scarica al primo run.

import { assert } from "jsr:@std/assert@1";
import { extractArticle } from "./extract-article.ts";

const ARTICLE_HTML = `<!doctype html>
<html lang="it">
<head><title>Come fare il pane</title></head>
<body>
  <header><nav>Menu di navigazione che non c'entra</nav></header>
  <article>
    <h1>Come fare il pane in casa</h1>
    <p>Per fare un buon pane servono farina, acqua, lievito e sale. La lavorazione
    richiede pazienza e una lunga lievitazione per sviluppare il glutine.</p>
    <p>Dopo la prima lievitazione si forma la pagnotta e si lascia riposare ancora
    un paio d'ore prima di infornare a temperatura molto alta.</p>
  </article>
  <footer>Copyright 2026 — link a cose irrilevanti</footer>
</body>
</html>`;

Deno.test("extractArticle: estrae il corpo dell'articolo dal contenuto principale", () => {
  const { text, title } = extractArticle(ARTICLE_HTML, "https://example.com/pane");
  assert(text.includes("farina, acqua, lievito e sale"));
  assert(text.includes("pagnotta"));
  // Il chrome della pagina (menu/footer) non deve dominare il testo.
  assert(!text.includes("Menu di navigazione"));
  assert(title !== null && title.toLowerCase().includes("pane"));
});

Deno.test("extractArticle: fallback a strip HTML su markup senza articolo", () => {
  // HTML senza struttura riconoscibile da readability → fallback htmlToText.
  const html = "<div>Testo<b>semplice</b> senza struttura di articolo.</div>";
  const { text } = extractArticle(html, "https://example.com/x");
  assert(text.includes("Testo"));
  assert(text.includes("semplice"));
});

Deno.test("extractArticle: input vuoto non lancia", () => {
  const { text } = extractArticle("", "https://example.com/x");
  assert(typeof text === "string");
});
