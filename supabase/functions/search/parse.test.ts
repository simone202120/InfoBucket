import { assertEquals } from "jsr:@std/assert@1";
import { DEFAULT_RESULTS, MAX_RESULTS, readLimit, readQuery } from "./parse.ts";

Deno.test("readQuery normalizza e gestisce input mancanti", () => {
  assertEquals(readQuery({ q: "  pasta madre  " }), "pasta madre");
  assertEquals(readQuery({ q: "" }), "");
  assertEquals(readQuery({}), "");
  assertEquals(readQuery(null), "");
  assertEquals(readQuery({ q: 42 }), "");
});

Deno.test("readLimit vincola il numero di risultati", () => {
  assertEquals(readLimit({ limit: 5 }), 5);
  assertEquals(readLimit({ limit: 0 }), 1);
  assertEquals(readLimit({ limit: 999 }), MAX_RESULTS);
  assertEquals(readLimit({ limit: 3.5 }), DEFAULT_RESULTS);
  assertEquals(readLimit({}), DEFAULT_RESULTS);
});
