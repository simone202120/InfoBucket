// Test per detectSourceType (allineato a spec §6.1).
// Esegui con: deno test  (dentro supabase/functions/)

import { assertEquals } from "jsr:@std/assert@1";
import { detectSourceType } from "./source-type.ts";

Deno.test("storage_path → document (precede l'URL)", () => {
  assertEquals(
    detectSourceType({ url: "https://example.com/x.pdf", storagePath: "docs/x.pdf" }),
    "document",
  );
  assertEquals(detectSourceType({ url: null, storagePath: "docs/x.pdf" }), "document");
});

Deno.test("youtube.com e youtu.be → youtube", () => {
  assertEquals(detectSourceType({ url: "https://www.youtube.com/watch?v=abc" }), "youtube");
  assertEquals(detectSourceType({ url: "https://youtu.be/abc" }), "youtube");
  assertEquals(detectSourceType({ url: "https://m.youtube.com/watch?v=abc" }), "youtube");
});

Deno.test("tiktok.com → tiktok", () => {
  assertEquals(detectSourceType({ url: "https://www.tiktok.com/@u/video/123" }), "tiktok");
  assertEquals(detectSourceType({ url: "https://vm.tiktok.com/abc" }), "tiktok");
});

Deno.test("instagram.com → reel", () => {
  assertEquals(detectSourceType({ url: "https://www.instagram.com/reel/abc/" }), "reel");
  assertEquals(detectSourceType({ url: "https://instagram.com/p/abc/" }), "reel");
});

Deno.test("URL http(s) generico → article", () => {
  assertEquals(detectSourceType({ url: "https://example.com/blog/post" }), "article");
  assertEquals(detectSourceType({ url: "http://news.example.org/a" }), "article");
});

Deno.test("URL assente o non valido → other", () => {
  assertEquals(detectSourceType({ url: null }), "other");
  assertEquals(detectSourceType({ url: "" }), "other");
  assertEquals(detectSourceType({ url: "   " }), "other");
  assertEquals(detectSourceType({ url: "non-un-url" }), "other");
  // Schema non http(s): non instradabile come articolo.
  assertEquals(detectSourceType({ url: "ftp://example.com/file" }), "other");
  assertEquals(detectSourceType({ url: "javascript:alert(1)" }), "other");
});

Deno.test("no match parziale sul dominio (anti-spoofing)", () => {
  // 'youtube.com.evil.com' NON deve essere youtube.
  assertEquals(detectSourceType({ url: "https://youtube.com.evil.com/x" }), "article");
  // 'faketiktok.com' NON deve essere tiktok.
  assertEquals(detectSourceType({ url: "https://faketiktok.com/x" }), "article");
});
