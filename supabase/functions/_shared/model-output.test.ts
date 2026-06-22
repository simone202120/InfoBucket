// Test per parseModelOutput (validazione output AI non fidato, spec §6.2).
// Esegui con: deno test  (dentro supabase/functions/)

import { assert, assertEquals } from "jsr:@std/assert@1";
import { parseModelOutput } from "./model-output.ts";

const VALID_UUID = "11111111-1111-1111-1111-111111111111";

Deno.test("output valido: bucket existing", () => {
  const res = parseModelOutput({
    summary: "Un riassunto.",
    tags: ["a", "b"],
    bucket: { match: "existing", existing_id: VALID_UUID, new_name: null },
  });
  assert(res.ok);
  if (res.ok) {
    assertEquals(res.value.summary, "Un riassunto.");
    assertEquals(res.value.tags, ["a", "b"]);
    assertEquals(res.value.bucket.match, "existing");
    assertEquals(res.value.bucket.existingId, VALID_UUID);
    assertEquals(res.value.bucket.newName, null);
  }
});

Deno.test("output valido: bucket new (existing_id ignorato e azzerato)", () => {
  const res = parseModelOutput({
    summary: "x",
    tags: [],
    bucket: { match: "new", existing_id: "spazzatura", new_name: "Ricette" },
  });
  assert(res.ok);
  if (res.ok) {
    assertEquals(res.value.bucket.match, "new");
    assertEquals(res.value.bucket.existingId, null);
    assertEquals(res.value.bucket.newName, "Ricette");
  }
});

Deno.test("output valido: bucket none", () => {
  const res = parseModelOutput({
    summary: "x",
    tags: ["t"],
    bucket: { match: "none", existing_id: null, new_name: null },
  });
  assert(res.ok);
  if (res.ok) assertEquals(res.value.bucket.match, "none");
});

Deno.test("accetta stringa JSON grezza", () => {
  const res = parseModelOutput(
    JSON.stringify({ summary: "s", tags: ["a"], bucket: { match: "none" } }),
  );
  assert(res.ok);
});

Deno.test("accetta JSON dentro code-fence ```json", () => {
  const text = "```json\n{\"summary\":\"s\",\"tags\":[],\"bucket\":{\"match\":\"none\"}}\n```";
  const res = parseModelOutput(text);
  assert(res.ok);
});

Deno.test("tags: trim, dedup case-insensitive, scarta vuoti", () => {
  const res = parseModelOutput({
    summary: "s",
    tags: ["  Pasta ", "pasta", "", "Forno"],
    bucket: { match: "none" },
  });
  assert(res.ok);
  if (res.ok) assertEquals(res.value.tags, ["Pasta", "Forno"]);
});

Deno.test("malformato: JSON non parseabile", () => {
  const res = parseModelOutput("{non json");
  assert(!res.ok);
});

Deno.test("malformato: stringa vuota", () => {
  assert(!parseModelOutput("").ok);
  assert(!parseModelOutput("   ").ok);
});

Deno.test("malformato: non è un oggetto", () => {
  assert(!parseModelOutput(42).ok);
  assert(!parseModelOutput(null).ok);
  assert(!parseModelOutput([1, 2, 3]).ok);
  assert(!parseModelOutput("[1,2,3]").ok);
});

Deno.test("malformato: summary mancante o vuoto", () => {
  assert(!parseModelOutput({ tags: [], bucket: { match: "none" } }).ok);
  assert(!parseModelOutput({ summary: "  ", tags: [], bucket: { match: "none" } }).ok);
  assert(!parseModelOutput({ summary: 5, tags: [], bucket: { match: "none" } }).ok);
});

Deno.test("malformato: tags non array o con elementi non stringa", () => {
  assert(!parseModelOutput({ summary: "s", tags: "a,b", bucket: { match: "none" } }).ok);
  assert(!parseModelOutput({ summary: "s", tags: [1, 2], bucket: { match: "none" } }).ok);
});

Deno.test("malformato: bucket mancante o match invalido", () => {
  assert(!parseModelOutput({ summary: "s", tags: [] }).ok);
  assert(!parseModelOutput({ summary: "s", tags: [], bucket: { match: "boh" } }).ok);
  assert(!parseModelOutput({ summary: "s", tags: [], bucket: null }).ok);
});

Deno.test("malformato: existing senza uuid valido", () => {
  assert(
    !parseModelOutput({
      summary: "s",
      tags: [],
      bucket: { match: "existing", existing_id: "non-uuid", new_name: null },
    }).ok,
  );
  assert(
    !parseModelOutput({
      summary: "s",
      tags: [],
      bucket: { match: "existing", existing_id: null, new_name: null },
    }).ok,
  );
});

Deno.test("malformato: new senza new_name", () => {
  assert(
    !parseModelOutput({
      summary: "s",
      tags: [],
      bucket: { match: "new", existing_id: null, new_name: "  " },
    }).ok,
  );
});
