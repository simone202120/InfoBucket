// Test per il parsing del transcript YouTube (funzioni pure).
// Esegui con: deno test  (dentro supabase/functions/)

import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  extractCaptionTracks,
  parseJson3Transcript,
  pickTrack,
} from "./youtube-transcript.ts";

Deno.test("extractCaptionTracks: estrae le tracce da ytInitialPlayerResponse", () => {
  const player = {
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [
          { baseUrl: "https://yt/timedtext?lang=it", languageCode: "it" },
          { baseUrl: "https://yt/timedtext?lang=en", languageCode: "en", kind: "asr" },
        ],
      },
    },
  };
  // Oggetto annidato con graffe → il parser deve bilanciarle correttamente.
  const html =
    `<script>var ytInitialPlayerResponse = ${JSON.stringify(player)};</script>`;
  const tracks = extractCaptionTracks(html);
  assertEquals(tracks.length, 2);
  assertEquals(tracks[0].languageCode, "it");
  assertEquals(tracks[1].kind, "asr");
});

Deno.test("extractCaptionTracks: nessun player response → array vuoto", () => {
  assertEquals(extractCaptionTracks("<html>nulla qui</html>"), []);
});

Deno.test("extractCaptionTracks: player senza captionTracks → array vuoto", () => {
  const html = `ytInitialPlayerResponse = {"videoDetails":{"title":"x"}};`;
  assertEquals(extractCaptionTracks(html), []);
});

Deno.test("extractCaptionTracks: scarta tracce senza baseUrl", () => {
  const player = {
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [{ languageCode: "it" }, { baseUrl: "u", languageCode: "en" }],
      },
    },
  };
  const html = `ytInitialPlayerResponse = ${JSON.stringify(player)}`;
  const tracks = extractCaptionTracks(html);
  assertEquals(tracks.length, 1);
  assertEquals(tracks[0].baseUrl, "u");
});

Deno.test("pickTrack: preferisce italiano, poi inglese, poi la prima", () => {
  assertEquals(
    pickTrack([
      { baseUrl: "a", languageCode: "fr" },
      { baseUrl: "b", languageCode: "en" },
      { baseUrl: "c", languageCode: "it" },
    ])?.baseUrl,
    "c",
  );
  assertEquals(
    pickTrack([
      { baseUrl: "a", languageCode: "fr" },
      { baseUrl: "b", languageCode: "en-US" },
    ])?.baseUrl,
    "b",
  );
  assertEquals(
    pickTrack([{ baseUrl: "a", languageCode: "de" }])?.baseUrl,
    "a",
  );
  assertEquals(pickTrack([]), null);
});

Deno.test("parseJson3Transcript: unisce i segmenti utf8", () => {
  const json = JSON.stringify({
    events: [
      { segs: [{ utf8: "Ciao " }, { utf8: "a tutti" }] },
      { segs: [{ utf8: " oggi" }] },
      { segs: [{ utf8: "\n" }] },
    ],
  });
  assertEquals(parseJson3Transcript(json), "Ciao a tutti oggi");
});

Deno.test("parseJson3Transcript: robusto a eventi/segmenti malformati", () => {
  assertEquals(parseJson3Transcript("non json"), "");
  assertEquals(parseJson3Transcript(JSON.stringify({ events: "x" })), "");
  assertEquals(parseJson3Transcript(JSON.stringify({})), "");
  assert(
    parseJson3Transcript(
      JSON.stringify({ events: [{ segs: [{}, { utf8: "ok" }] }, null] }),
    ) === "ok",
  );
});
