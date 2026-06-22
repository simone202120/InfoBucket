import { detectSourceType, hostnameOf, isValidHttpUrl } from '../source';

describe('detectSourceType', () => {
  it('riconosce YouTube (entrambi i domini)', () => {
    expect(detectSourceType('https://www.youtube.com/watch?v=abc')).toBe('youtube');
    expect(detectSourceType('https://youtu.be/abc')).toBe('youtube');
  });

  it('riconosce TikTok e Instagram (reel)', () => {
    expect(detectSourceType('https://www.tiktok.com/@a/video/1')).toBe('tiktok');
    expect(detectSourceType('https://instagram.com/reel/xyz')).toBe('reel');
  });

  it('classifica un URL http generico come article', () => {
    expect(detectSourceType('https://example.com/post')).toBe('article');
  });

  it('senza URL valido ritorna other', () => {
    expect(detectSourceType(null)).toBe('other');
    expect(detectSourceType('non un url')).toBe('other');
  });
});

describe('hostnameOf', () => {
  it('normalizza rimuovendo www e abbassando il case', () => {
    expect(hostnameOf('https://WWW.Example.COM/x')).toBe('example.com');
  });
  it('ritorna null per input non valido', () => {
    expect(hostnameOf('boh')).toBeNull();
  });
});

describe('isValidHttpUrl', () => {
  it('accetta http/https e rifiuta il resto', () => {
    expect(isValidHttpUrl('http://a.com')).toBe(true);
    expect(isValidHttpUrl('https://a.com')).toBe(true);
    expect(isValidHttpUrl('ftp://a.com')).toBe(false);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('   ')).toBe(false);
  });
});
