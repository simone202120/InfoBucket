// Test per la costruzione del prompt e dell'input embedding (funzioni pure).
// Esegui con: deno test  (dentro supabase/functions/)

import { assert, assertEquals } from "jsr:@std/assert@1";
import { buildEmbeddingInput, buildPrompt } from "./ai.ts";

Deno.test("buildPrompt: include system + user, con bucket e nota", () => {
  const messages = buildPrompt({
    rawContent: "Contenuto dell'articolo.",
    note: "Riassumi solo i passaggi pratici.",
    buckets: [
      { id: "11111111-1111-1111-1111-111111111111", name: "Ricette", description: "Cucina" },
      { id: "22222222-2222-2222-2222-222222222222", name: "Lavoro", description: null },
    ],
  });

  assertEquals(messages.length, 2);
  assertEquals(messages[0].role, "system");
  assertEquals(messages[1].role, "user");

  const user = messages[1].content;
  assert(user.includes("Contenuto dell'articolo."));
  assert(user.includes("Riassumi solo i passaggi pratici."));
  // I bucket vanno elencati con id e nome (servono al matching, §8).
  assert(user.includes("11111111-1111-1111-1111-111111111111"));
  assert(user.includes("Ricette"));
  assert(user.includes("Cucina"));
  assert(user.includes("Lavoro"));
});

Deno.test("buildPrompt: system chiede output JSON", () => {
  const messages = buildPrompt({ rawContent: "x", note: null, buckets: [] });
  assert(messages[0].content.toLowerCase().includes("json"));
});

Deno.test("buildPrompt: gestisce assenza di bucket e di nota", () => {
  const messages = buildPrompt({ rawContent: "x", note: null, buckets: [] });
  const user = messages[1].content;
  assert(user.includes("(nessun bucket esistente)"));
  assert(user.includes("(nessuna nota)"));
});

Deno.test("buildPrompt: gestisce raw_content vuoto", () => {
  const messages = buildPrompt({ rawContent: null, note: "nota", buckets: [] });
  assert(messages[1].content.includes("(nessun contenuto estratto)"));
});

Deno.test("buildEmbeddingInput: concatena summary + raw + note, scarta vuoti", () => {
  assertEquals(
    buildEmbeddingInput("Riassunto", "Grezzo", "Nota"),
    "Riassunto\nGrezzo\nNota",
  );
  assertEquals(buildEmbeddingInput("Riassunto", null, "  "), "Riassunto");
  assertEquals(buildEmbeddingInput("Solo summary", null, null), "Solo summary");
});

Deno.test("buildEmbeddingInput: tronca input molto lunghi", () => {
  const big = "parola ".repeat(10_000);
  const out = buildEmbeddingInput("s", big, null);
  // Resta entro un limite ragionevole (qualche decina di migliaia di caratteri).
  assert(out.length < 20_000);
});
