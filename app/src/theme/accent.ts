/**
 * Derivazione dell'accento personalizzato. Da una sola tinta scelta dall'utente
 * ricava le varianti (hover/press/soft) coerenti col tema chiaro o scuro e
 * sceglie il colore del testo sopra l'accento garantendo contrasto WCAG AA.
 * Tutto puro e testabile: nessuna dipendenza da React o dai token grezzi.
 */
type Rgb = { r: number; g: number; b: number };

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function parseHex(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return { r: Number.isNaN(r) ? 0 : r, g: Number.isNaN(g) ? 0 : g, b: Number.isNaN(b) ? 0 : b };
}

function toHex({ r, g, b }: Rgb): string {
  const c = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function channelLuminance(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Mescola un colore verso target (0 = invariato, 1 = target). */
function mix(hex: string, target: Rgb, amount: number): string {
  const c = parseHex(hex);
  return toHex({
    r: c.r + (target.r - c.r) * amount,
    g: c.g + (target.g - c.g) * amount,
    b: c.b + (target.b - c.b) * amount,
  });
}

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const INK = '#16240F';

export interface AccentVariants {
  primary: string;
  primaryHover: string;
  primaryPress: string;
  primarySoft: string;
  primarySoft2: string;
  textOnPrimary: string;
}

export function deriveAccent(hex: string, mode: 'light' | 'dark'): AccentVariants {
  // In dark schiariamo leggermente la tinta perché risalti sul fondo scuro.
  const primary = mode === 'dark' ? mix(hex, WHITE, 0.18) : hex;
  const hover = mode === 'dark' ? mix(primary, WHITE, 0.1) : mix(primary, BLACK, 0.08);
  const press = mode === 'dark' ? mix(primary, BLACK, 0.12) : mix(primary, BLACK, 0.18);
  // Soft: verso il fondo del tema (chiaro o scuro).
  const soft = mode === 'dark' ? mix(primary, BLACK, 0.78) : mix(primary, WHITE, 0.84);
  const soft2 = mode === 'dark' ? mix(primary, BLACK, 0.68) : mix(primary, WHITE, 0.72);
  // Testo sopra l'accento: scegli ink o bianco per il contrasto migliore (≥AA).
  const textOnPrimary = contrastRatio(INK, primary) >= contrastRatio('#FFFFFF', primary) ? INK : '#FFFFFF';
  return { primary, primaryHover: hover, primaryPress: press, primarySoft: soft, primarySoft2: soft2, textOnPrimary };
}
