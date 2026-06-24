import { contrastRatio, deriveAccent, relativeLuminance } from '../accent';

it('calcola la luminanza: nero < bianco', () => {
  expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
});

it('il contrasto bianco/nero è ~21:1', () => {
  expect(contrastRatio('#FFFFFF', '#000000')).toBeGreaterThan(20);
});

it('sceglie testo scuro su accento chiaro e bianco su accento scuro (AA)', () => {
  const lightAccent = deriveAccent('#E5D24A', 'light'); // giallo chiaro → testo scuro
  expect(contrastRatio(lightAccent.textOnPrimary, lightAccent.primary)).toBeGreaterThanOrEqual(4.5);
  const darkAccent = deriveAccent('#3A2E8C', 'dark'); // viola scuro → testo chiaro
  expect(contrastRatio(darkAccent.textOnPrimary, darkAccent.primary)).toBeGreaterThanOrEqual(4.5);
});

it('produce tutte le varianti richieste', () => {
  const a = deriveAccent('#2D5AD9', 'light');
  for (const k of ['primary', 'primaryHover', 'primaryPress', 'primarySoft', 'primarySoft2', 'textOnPrimary'] as const) {
    expect(typeof a[k]).toBe('string');
  }
});
