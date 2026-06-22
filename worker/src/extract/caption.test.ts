import { describe, it, expect } from 'vitest';
import {
  parseTiktokOembed,
  parseOpenGraph,
  parseYoutubeDump,
  extractMetaTags,
  tiktokOembedUrl,
  fetchCaptionMetadata,
  type CaptionDeps,
} from './caption.ts';

describe('parseTiktokOembed', () => {
  it('estrae caption e autore (@handle) dalla risposta oEmbed', () => {
    const json = {
      title: 'come fare la pasta madre #ricetta',
      author_name: 'Tizio Cucina',
      author_unique_id: 'tiziocucina',
    };
    expect(parseTiktokOembed(json)).toEqual({
      caption: 'come fare la pasta madre #ricetta',
      author: '@tiziocucina',
    });
  });

  it('usa author_name quando manca lo unique id', () => {
    expect(
      parseTiktokOembed({ title: 't', author_name: 'Tizio Cucina' }),
    ).toEqual({ caption: 't', author: 'Tizio Cucina' });
  });

  it('degrada con grazia su campi mancanti', () => {
    expect(parseTiktokOembed({})).toEqual({ caption: null, author: null });
  });

  it('valida input non fidati (null, primitivi, array)', () => {
    expect(parseTiktokOembed(null)).toEqual({ caption: null, author: null });
    expect(parseTiktokOembed('stringa')).toEqual({ caption: null, author: null });
    expect(parseTiktokOembed(42)).toEqual({ caption: null, author: null });
  });

  it('tratta i campi vuoti/solo-spazi come assenti', () => {
    expect(
      parseTiktokOembed({ title: '   ', author_name: '', author_unique_id: '' }),
    ).toEqual({ caption: null, author: null });
  });
});

describe('extractMetaTags', () => {
  it('legge property-prima e content-prima, doppie e singole virgolette', () => {
    const html = `
      <meta property="og:title" content="Titolo">
      <meta content='Descrizione' name='og:description'>
    `;
    expect(extractMetaTags(html)).toEqual({
      'og:title': 'Titolo',
      'og:description': 'Descrizione',
    });
  });

  it('decodifica le entità HTML comuni', () => {
    const html = `<meta property="og:title" content="Pasta &amp; Co &#39;90">`;
    expect(extractMetaTags(html)['og:title']).toBe("Pasta & Co '90");
  });

  it('mantiene la prima occorrenza di una chiave duplicata', () => {
    const html =
      '<meta property="og:title" content="primo">' +
      '<meta property="og:title" content="secondo">';
    expect(extractMetaTags(html)['og:title']).toBe('primo');
  });

  it('ignora i meta senza content o senza chiave', () => {
    const html =
      '<meta property="og:title">' + '<meta charset="utf-8">';
    expect(extractMetaTags(html)).toEqual({});
  });
});

describe('parseOpenGraph', () => {
  it('usa og:description come caption e ricava @handle dal titolo IG', () => {
    const html = `
      <meta property="og:title" content="Mario Rossi (@mario.rossi) on Instagram">
      <meta property="og:description" content="Guarda questo reel sulla pasta">
    `;
    expect(parseOpenGraph(html)).toEqual({
      caption: 'Guarda questo reel sulla pasta',
      author: '@mario.rossi',
    });
  });

  it('cade su og:title come caption se manca la description', () => {
    const html = `<meta property="og:title" content="Solo Titolo">`;
    expect(parseOpenGraph(html)).toEqual({
      caption: 'Solo Titolo',
      author: null,
    });
  });

  it('ricava l\'autore dal pattern "X on Instagram" senza handle', () => {
    const html = `<meta property="og:title" content="Mario Rossi on Instagram: nuovo post">`;
    const out = parseOpenGraph(html);
    expect(out.author).toBe('Mario Rossi');
  });

  it('usa i fallback twitter:* quando mancano gli og:*', () => {
    const html = `<meta name="twitter:description" content="dalla card twitter">`;
    expect(parseOpenGraph(html).caption).toBe('dalla card twitter');
  });

  it('degrada con grazia su HTML vuoto o non valido (IG fragile)', () => {
    expect(parseOpenGraph('')).toEqual({ caption: null, author: null });
    expect(parseOpenGraph('<html><body>niente meta</body></html>')).toEqual({
      caption: null,
      author: null,
    });
  });
});

describe('tiktokOembedUrl', () => {
  it('costruisce l\'URL oEmbed ufficiale con l\'URL fonte codificato', () => {
    expect(tiktokOembedUrl('https://www.tiktok.com/@a/video/123')).toBe(
      'https://www.tiktok.com/oembed?url=https%3A%2F%2Fwww.tiktok.com%2F%40a%2Fvideo%2F123',
    );
  });
});

describe('parseYoutubeDump', () => {
  it('compone titolo + descrizione e usa uploader_id come autore', () => {
    expect(
      parseYoutubeDump({
        title: 'Come fare la pasta',
        description: 'In questo video spiego...',
        uploader_id: '@canale',
        uploader: 'Canale Cucina',
      }),
    ).toEqual({
      caption: 'Come fare la pasta\nIn questo video spiego...',
      author: '@canale',
    });
  });

  it('cade su uploader/channel se manca uploader_id', () => {
    expect(
      parseYoutubeDump({ title: 't', channel: 'Canale' }),
    ).toEqual({ caption: 't', author: 'Canale' });
  });

  it('usa solo il titolo quando manca la descrizione', () => {
    expect(parseYoutubeDump({ title: 'solo titolo' }).caption).toBe(
      'solo titolo',
    );
  });

  it('degrada con grazia su input non fidati', () => {
    expect(parseYoutubeDump(null)).toEqual({ caption: null, author: null });
    expect(parseYoutubeDump('x')).toEqual({ caption: null, author: null });
    expect(parseYoutubeDump({})).toEqual({ caption: null, author: null });
  });
});

describe('fetchCaptionMetadata', () => {
  const deps = (over: Partial<CaptionDeps>): CaptionDeps => ({
    fetcher: () => Promise.reject(new Error('fetcher non atteso')),
    dumpMetadata: () => Promise.reject(new Error('dumper non atteso')),
    ...over,
  });

  it('tiktok: chiama l\'oEmbed via fetcher e ne fa il parse', async () => {
    let requested = '';
    const out = await fetchCaptionMetadata(
      'tiktok',
      'https://www.tiktok.com/@a/video/1',
      deps({
        fetcher: (url) => {
          requested = url;
          return Promise.resolve(
            JSON.stringify({ title: 'cap', author_unique_id: 'a' }),
          );
        },
      }),
    );
    expect(requested).toContain('tiktok.com/oembed');
    expect(out).toEqual({ caption: 'cap', author: '@a' });
  });

  it('reel: scarica la pagina e legge gli Open Graph', async () => {
    const html =
      '<meta property="og:description" content="caption reel">';
    const out = await fetchCaptionMetadata(
      'reel',
      'https://instagram.com/reel/1',
      deps({ fetcher: () => Promise.resolve(html) }),
    );
    expect(out.caption).toBe('caption reel');
  });

  it('youtube: usa il dumper yt-dlp (non il fetcher HTTP)', async () => {
    const out = await fetchCaptionMetadata(
      'youtube',
      'https://youtu.be/1',
      deps({
        dumpMetadata: () =>
          Promise.resolve(JSON.stringify({ title: 'video', uploader: 'c' })),
      }),
    );
    expect(out).toEqual({ caption: 'video', author: 'c' });
  });

  it('degrada a EMPTY se l\'I/O fallisce (caption opzionale, §7.2)', async () => {
    const out = await fetchCaptionMetadata(
      'tiktok',
      'https://www.tiktok.com/@a/video/1',
      deps({ fetcher: () => Promise.reject(new Error('rete giù')) }),
    );
    expect(out).toEqual({ caption: null, author: null });
  });

  it('degrada a EMPTY su JSON malformato', async () => {
    const out = await fetchCaptionMetadata(
      'tiktok',
      'https://www.tiktok.com/@a/video/1',
      deps({ fetcher: () => Promise.resolve('non-json{') }),
    );
    expect(out).toEqual({ caption: null, author: null });
  });
});
