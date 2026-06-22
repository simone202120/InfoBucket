import { describe, it, expect } from 'vitest';
import {
  parseTiktokOembed,
  parseOpenGraph,
  extractMetaTags,
  tiktokOembedUrl,
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
