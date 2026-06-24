// Test per l'estrazione YouTube (parser puri + orchestrazione con fetch mockato).
// Esegui con: deno test  (dentro supabase/functions/)

import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  extractCaptionTracks,
  extractCaptionTracksFromPlayer,
  extractPlayerResponse,
  fetchYoutubeContent,
  mergeCaption,
  parseJson3Transcript,
  parseVideoDetails,
  parseVideoId,
  pickTrack,
} from "./youtube.ts";

Deno.test("parseVideoId: riconosce tutte le forme di URL", () => {
  assertEquals(parseVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assertEquals(parseVideoId("https://youtu.be/dQw4w9WgXcQ?t=10"), "dQw4w9WgXcQ");
  assertEquals(parseVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assertEquals(parseVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assertEquals(parseVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ&x=1"), "dQw4w9WgXcQ");
  assertEquals(parseVideoId("https://example.com/watch?v=dQw4w9WgXcQ"), null);
  assertEquals(parseVideoId("non-un-url"), null);
});

Deno.test("parseVideoDetails: estrae titolo/canale/descrizione", () => {
  const player = {
    videoDetails: { title: "Titolo", author: "Canale", shortDescription: "Sotto il video" },
  };
  assertEquals(parseVideoDetails(player), {
    title: "Titolo",
    author: "Canale",
    description: "Sotto il video",
  });
});

Deno.test("parseVideoDetails: robusto a player malformato", () => {
  assertEquals(parseVideoDetails(null), { title: null, author: null, description: null });
  assertEquals(parseVideoDetails({}), { title: null, author: null, description: null });
  assertEquals(parseVideoDetails({ videoDetails: { title: "  " } }), {
    title: null,
    author: null,
    description: null,
  });
});

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
  const html =
    `<script>var ytInitialPlayerResponse = ${JSON.stringify(player)};</script>`;
  const tracks = extractCaptionTracks(html);
  assertEquals(tracks.length, 2);
  assertEquals(tracks[0].languageCode, "it");
  assertEquals(tracks[1].kind, "asr");
});

Deno.test("extractCaptionTracksFromPlayer: scarta tracce senza baseUrl", () => {
  const player = {
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [{ languageCode: "it" }, { baseUrl: "u", languageCode: "en" }],
      },
    },
  };
  const tracks = extractCaptionTracksFromPlayer(player);
  assertEquals(tracks.length, 1);
  assertEquals(tracks[0].baseUrl, "u");
});

Deno.test("extractCaptionTracksFromPlayer: nessuna traccia → array vuoto", () => {
  assertEquals(extractCaptionTracksFromPlayer(null), []);
  assertEquals(extractCaptionTracksFromPlayer({ videoDetails: { title: "x" } }), []);
});

Deno.test("extractPlayerResponse: bilancia le graffe annidate", () => {
  const player = { videoDetails: { title: "x", shortDescription: "y { z }" } };
  const html = `ytInitialPlayerResponse = ${JSON.stringify(player)}; var x=1;`;
  const parsed = extractPlayerResponse(html);
  assert(parsed !== null);
  assertEquals((parsed as { videoDetails: { title: string } }).videoDetails.title, "x");
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
  assertEquals(pickTrack([{ baseUrl: "a", languageCode: "de" }])?.baseUrl, "a");
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
  assertEquals(
    parseJson3Transcript(
      JSON.stringify({ events: [{ segs: [{}, { utf8: "ok" }] }, null] }),
    ),
    "ok",
  );
});

Deno.test("mergeCaption: unisce titolo e descrizione", () => {
  assertEquals(mergeCaption("Titolo", "Descrizione"), "Titolo\nDescrizione");
  assertEquals(mergeCaption("Titolo", null), "Titolo");
  assertEquals(mergeCaption(null, "Descrizione"), "Descrizione");
  assertEquals(mergeCaption(null, null), null);
});

// --- fetchYoutubeContent: orchestrazione con fetch mockato (rete reale assente). ---

/** Costruisce un fetcher che instrada per URL, restituendo Response reali. */
function routedFetcher(routes: Record<string, () => Response>): typeof fetch {
  return ((input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [key, make] of Object.entries(routes)) {
      if (url.includes(key)) return Promise.resolve(make());
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as typeof fetch;
}

Deno.test("fetchYoutubeContent: InnerTube → caption (titolo+descrizione) + trascrizione", async () => {
  const playerJson = JSON.stringify({
    videoDetails: { title: "Come fare il pane", author: "Cucina", shortDescription: "Ricetta passo passo" },
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: [{ baseUrl: "https://yt/timedtext?lang=it", languageCode: "it" }],
      },
    },
  });
  const json3 = JSON.stringify({ events: [{ segs: [{ utf8: "Ciao a tutti" }] }] });

  const content = await fetchYoutubeContent(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    routedFetcher({
      "youtubei/v1/player": () => new Response(playerJson, { status: 200 }),
      "timedtext": () => new Response(json3, { status: 200 }),
    }),
  );

  assertEquals(content.caption, "Come fare il pane\nRicetta passo passo");
  assertEquals(content.author, "Cucina");
  assertEquals(content.transcript, "Ciao a tutti");
});

Deno.test("fetchYoutubeContent: InnerTube fallito → fallback HTML watch + oEmbed", async () => {
  const watchHtml = `<html>ytInitialPlayerResponse = ${
    JSON.stringify({ videoDetails: { title: "Titolo HTML", shortDescription: "Descr HTML" } })
  };</html>`;
  const oembed = JSON.stringify({ title: "Titolo oEmbed", author_name: "Canale oEmbed" });

  const content = await fetchYoutubeContent(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    routedFetcher({
      "youtubei/v1/player": () => new Response("nope", { status: 500 }),
      "oembed": () => new Response(oembed, { status: 200 }),
      // La pagina watch (non-oembed, non-player): match generico su youtube.com/watch.
      "watch?v=": () => new Response(watchHtml, { status: 200 }),
    }),
  );

  // Titolo/descrizione dalla pagina watch; il canale, mancante lì, arriva da oEmbed.
  assertEquals(content.caption, "Titolo HTML\nDescr HTML");
  assertEquals(content.author, "Canale oEmbed");
  assertEquals(content.transcript, null);
});

Deno.test("fetchYoutubeContent: tutto fallito → contenuto vuoto, non lancia", async () => {
  const content = await fetchYoutubeContent(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    routedFetcher({}), // ogni rotta → 404
  );
  assertEquals(content, { caption: null, author: null, transcript: null });
});
