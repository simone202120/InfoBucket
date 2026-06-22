import { describe, it, expect } from 'vitest';
import { composeRawContent } from './rawContent.ts';

describe('composeRawContent', () => {
  it('compone tutte le sezioni nell\'ordine Caption/Autore/Trascrizione', () => {
    const out = composeRawContent({
      caption: 'come fare la pasta madre',
      author: '@tizio',
      transcript: 'Ciao a tutti oggi vi spiego come...',
    });
    expect(out).toBe(
      '[Caption] come fare la pasta madre\n' +
        '[Autore] @tizio\n' +
        '[Trascrizione] Ciao a tutti oggi vi spiego come...',
    );
  });

  it('omette le sezioni mancanti (Instagram fragile: solo audio)', () => {
    expect(composeRawContent({ transcript: 'solo parlato' })).toBe(
      '[Trascrizione] solo parlato',
    );
  });

  it('omette caption assente ma tiene autore + trascrizione', () => {
    expect(
      composeRawContent({ caption: null, author: '@a', transcript: 't' }),
    ).toBe('[Autore] @a\n[Trascrizione] t');
  });

  it('tratta stringhe vuote o solo-spazi come assenti', () => {
    expect(
      composeRawContent({ caption: '   ', author: '', transcript: 'x' }),
    ).toBe('[Trascrizione] x');
  });

  it('fa il trim dei valori', () => {
    expect(composeRawContent({ caption: '  ciao  ' })).toBe('[Caption] ciao');
  });

  it('restituisce stringa vuota quando tutto manca', () => {
    expect(composeRawContent({})).toBe('');
    expect(
      composeRawContent({ caption: null, author: undefined, transcript: '' }),
    ).toBe('');
  });
});
