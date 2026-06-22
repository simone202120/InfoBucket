// Test per il parser caption lato server (gemello di worker/src/extract/caption).
// Esegui con: deno test  (dentro supabase/functions/)

import { assertEquals } from "jsr:@std/assert@1";
import {
  composeCaptionRawContent,
  fetchLightCaption,
  parseOpenGraph,
  parseTiktokOembed,
  tiktokOembedUrl,
} from "./caption.ts";

Deno.test("parseTiktokOembed: caption da title, autore da unique id", () => {
  const meta = parseTiktokOembed({
    title: "  Parliamo di X #hashtag  ",
    author_name: "Nome Leggibile",
    author_unique_id: "amedeoiasci",
  });
  assertEquals(meta, { caption: "Parliamo di X #hashtag", author: "@amedeoiasci" });
});

Deno.test("parseTiktokOembed: fallback al nome se manca lo unique id", () => {
  const meta = parseTiktokOembed({ title: "X", author_name: "Jashi Project" });
  assertEquals(meta, { caption: "X", author: "Jashi Project" });
});

Deno.test("parseTiktokOembed: input non oggetto → EMPTY", () => {
  assertEquals(parseTiktokOembed(null), { caption: null, author: null });
  assertEquals(parseTiktokOembed("stringa"), { caption: null, author: null });
});

Deno.test("parseOpenGraph: caption da og:description, autore da title IG", () => {
  const html = `<meta property="og:title" content="Tizio (@tizio) on Instagram">
    <meta property="og:description" content="La mia caption">`;
  assertEquals(parseOpenGraph(html), {
    caption: "La mia caption",
    author: "@tizio",
  });
});

Deno.test("composeCaptionRawContent: omette le sezioni mancanti", () => {
  assertEquals(
    composeCaptionRawContent({ caption: "C", author: "@a" }),
    "[Caption] C\n[Autore] @a",
  );
  assertEquals(composeCaptionRawContent({ caption: "C", author: null }), "[Caption] C");
  assertEquals(composeCaptionRawContent({ caption: null, author: null }), "");
});

Deno.test("tiktokOembedUrl: codifica l'URL fonte", () => {
  assertEquals(
    tiktokOembedUrl("https://vm.tiktok.com/abc/"),
    "https://www.tiktok.com/oembed?url=https%3A%2F%2Fvm.tiktok.com%2Fabc%2F",
  );
});

Deno.test("fetchLightCaption: tiktok → interroga l'oEmbed e ne fa il parse", async () => {
  let requested: string | null = null;
  const fetchText = (url: string): Promise<string> => {
    requested = url;
    return Promise.resolve(JSON.stringify({ title: "Ciao", author_unique_id: "u" }));
  };
  const meta = await fetchLightCaption("tiktok", "https://vm.tiktok.com/abc/", fetchText);
  assertEquals(meta, { caption: "Ciao", author: "@u" });
  assertEquals(requested, tiktokOembedUrl("https://vm.tiktok.com/abc/"));
});

Deno.test("fetchLightCaption: degrada a EMPTY se la rete/parse fallisce", async () => {
  const fetchText = (): Promise<string> => Promise.reject(new Error("rete giù"));
  const meta = await fetchLightCaption("tiktok", "https://vm.tiktok.com/abc/", fetchText);
  assertEquals(meta, { caption: null, author: null });
});
