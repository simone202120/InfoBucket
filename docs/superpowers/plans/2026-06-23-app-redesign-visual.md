# Piano 2 — Vestito visivo (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dare a InfoBucket l'identità visiva "Editorial Provenance" — temi Cloud (chiaro) e Ink (scuro), selettore accento esteso con colore personalizzato, header editoriale, icone reali (loghi brand + favicon), momento di brand al login, e la barra di provenienza come elemento firma — tutto via token, senza toccare backend/worker.

**Architecture:** Tutto lo stile passa dal theme adapter (`app/src/theme/`). Si aggiornano i token (palette + scrim + accenti), si aggiunge un modulo puro per derivare l'accento personalizzato, si persistono le preferenze tema (accento/modo/custom) in AsyncStorage, e si aggiornano i componenti del design system (SourceStamp, ItemCard, header, login). Le schermate non cambiano logica.

**Tech Stack:** TypeScript (strict), React Native, expo-router, AsyncStorage, Jest + @testing-library/react-native. Nessuna nuova dipendenza runtime.

**Riferimenti:** spec `docs/superpowers/specs/2026-06-23-app-polish-redesign-design.md` (§4, §3.5 avatar/scrim). Piano **2 di 3**. Presuppone il Piano 1 completato (Toast, AvatarMenu, TranscriptSheet, freschezza dati già presenti).

## Global Constraints

- TypeScript **strict** + `noUncheckedIndexedAccess`. Niente `any`/`as` per zittire il compilatore.
- **Nessuno stile hardcoded**: ogni colore/spaziatura/tipografia da `useTheme()`. I valori grezzi vivono SOLO in `app/src/theme/tokens.ts`.
- **Una sola fonte di stile**: i componenti leggono dall'adapter, mai dai token grezzi.
- **Accessibilità**: contrasto testo↔accento ≥ WCAG AA (rapporto ≥ 4.5:1 per testo normale) garantito anche per l'accento personalizzato; touch ≥ 44pt.
- **Temi (valori esatti):**
  - Cloud (light): `bg #F5F6F8`, `surface #FFFFFF`, `textPrimary #191F26`, `textSecondary #5C6773`, `textTertiary #9098A3`, `border #E4E7EB`, `scrim #16202B` (usato con bassa opacità).
  - Ink (dark): `bg #0F1217`, `bgSunken #0A0D12`, `surface #181D24`, `surfaceRaised #212833`, `textPrimary #ECF1F6`, `textSecondary #9AA6B2`, `textTertiary #646F7A`, `border #252C35`, `scrim #000000`.
  - Accento default: verde oliva esistente (`olive`).
- **Loghi brand reali** per youtube/reel/tiktok; **favicon reale** del dominio per gli articoli (fallback al glifo); icone duotone per documento/nota.
- Comandi da `app/`: `npm test -- <pattern>`, `npm run typecheck`, `npm run lint`.
- Commit piccoli, messaggi in italiano, trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

- Modify `app/src/theme/tokens.ts` — palette Cloud/Ink, `scrim` in `ColorScheme`, nuovi accenti in `accents`.
- Modify `app/src/theme/index.ts` — esporre `scrim` nel `Theme`; gestire accento custom + persistenza in `ThemeProvider`/`useThemeControls`.
- Create `app/src/theme/accent.ts` — derivazione pura dell'accento personalizzato (luminanza, varianti, scelta testo).
- Create `app/src/theme/themeStorage.ts` — load/save preferenze tema (AsyncStorage).
- Modify `app/src/theme/icons.tsx` — loghi brand reali + glifi duotone documento/nota.
- Modify `app/src/theme/components/SourceStamp.tsx` — scelta logo brand / favicon / glifo per fonte.
- Create `app/src/theme/components/Favicon.tsx` — immagine favicon con fallback.
- Modify `app/src/theme/components/ItemCard.tsx` — barra di provenienza (rail).
- Modify `app/src/theme/components/AvatarMenu.tsx` — usare `t.colors.scrim` (toglie l'hardcode del Piano 1).
- Create `app/src/theme/components/ScreenHeader.tsx` — header editoriale condiviso (titolo grande + occhiello + avatar).
- Modify `app/app/(tabs)/index.tsx`, `library.tsx`, `search.tsx` — usare `ScreenHeader`.
- Modify `app/app/settings.tsx` — accenti estesi + voce "Personalizza" (color picker).
- Create `app/src/theme/components/AccentPicker.tsx` — selettore colore personalizzato (hue + hex, senza nuove dipendenze).
- Modify `app/app/login.tsx` + `app/app/_layout.tsx` — wordmark/brand + splash brandizzato.
- Create `app/src/theme/components/Wordmark.tsx` — logotype InfoBucket + glifo provenienza.
- Tests affiancati in `__tests__/`.

---

### Task 1: Token — palette Cloud/Ink + `scrim`

**Files:**
- Modify: `app/src/theme/tokens.ts`
- Modify: `app/src/theme/index.ts`
- Modify: `app/src/theme/components/AvatarMenu.tsx`
- Test: `app/src/theme/__tests__/theme-scrim.test.tsx`

**Interfaces:**
- Produces: `Theme.colors.scrim: string` esposto dall'adapter; palette aggiornata Cloud/Ink.

- [ ] **Step 1: Write the failing test**

```tsx
// app/src/theme/__tests__/theme-scrim.test.tsx
import { renderHook } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/theme';

const wrap = ({ children }: { children: ReactNode }) => createElement(ThemeProvider, null, children);

it('espone il colore scrim dal tema', () => {
  const { result } = renderHook(() => useTheme(), { wrapper: wrap });
  expect(typeof result.current.colors.scrim).toBe('string');
  expect(result.current.colors.scrim.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- theme-scrim`
Expected: FAIL (`scrim` non esiste su `colors`).

- [ ] **Step 3: Aggiungere `scrim` all'interfaccia e ai due schemi**

In `app/src/theme/tokens.ts`:
- aggiungere `scrim: string;` all'interfaccia `ColorScheme` (vicino a `border`).
- in `color.light` aggiornare i valori al tema **Cloud** e aggiungere `scrim: '#16202B'`:
  `bg: '#F5F6F8'`, `bgSunken: '#E7EAEE'`, `surface: '#FFFFFF'`, `surfaceRaised: '#FFFFFF'`, `surfaceHover: '#F0F2F5'`, `textPrimary: '#191F26'`, `textSecondary: '#5C6773'`, `textTertiary: '#9098A3'`, `border: '#E4E7EB'`, `borderStrong: '#CBD2D9'`. (Lasciare invariati `primary*`, `accent*`, `success/warning/danger`, `src`, `status` salvo necessità.)
- in `color.dark` aggiornare al tema **Ink** e aggiungere `scrim: '#000000'`:
  `bg: '#0F1217'`, `bgSunken: '#0A0D12'`, `surface: '#181D24'`, `surfaceRaised: '#212833'`, `surfaceHover: '#1E242C'`, `textPrimary: '#ECF1F6'`, `textSecondary: '#9AA6B2'`, `textTertiary: '#646F7A'`, `border: '#252C35'`, `borderStrong: '#36404B'`.

- [ ] **Step 4: Esporre `scrim` (nessuna modifica necessaria se l'adapter copia `colors`)**

Verificare in `app/src/theme/index.ts` che `buildTheme` faccia `const colors = { ...base, primary, focusRing: primary }` — `scrim` arriva da `base`, quindi è già esposto. Nessuna modifica di codice; confermare col typecheck.

- [ ] **Step 5: AvatarMenu usa `scrim` (rimuove l'hardcode del Piano 1)**

In `app/src/theme/components/AvatarMenu.tsx`, lo `styles.backdrop` non può usare il tema (è static). Spostare il colore di backdrop inline sul `View`/`Pressable` del backdrop:
```tsx
// nel render del Modal, sul Pressable backdrop:
style={[styles.backdrop, { backgroundColor: t.colors.scrim + '33' }]}
```
e rimuovere `backgroundColor: '#00000033'` da `styles.backdrop` in `StyleSheet.create` (lasciare lì solo layout). Mantenere il resto.

- [ ] **Step 6: Run test + typecheck**

Run: `npm test -- theme-scrim` → PASS.
Run: `npm run typecheck` → nessun errore.

- [ ] **Step 7: Commit**

```bash
git add app/src/theme/tokens.ts app/src/theme/index.ts app/src/theme/components/AvatarMenu.tsx app/src/theme/__tests__/theme-scrim.test.tsx
git commit -m "Tema: palette Cloud/Ink + token scrim (e AvatarMenu lo usa)"
```

---

### Task 2: Derivazione accento personalizzato (`accent.ts`)

**Files:**
- Create: `app/src/theme/accent.ts`
- Test: `app/src/theme/__tests__/accent.test.ts`

**Interfaces:**
- Produces:
  - `relativeLuminance(hex: string): number` — luminanza relativa WCAG (0..1).
  - `contrastRatio(a: string, b: string): number`.
  - `deriveAccent(hex: string, mode: 'light' | 'dark'): { primary: string; primaryHover: string; primaryPress: string; primarySoft: string; primarySoft2: string; textOnPrimary: string }` — varianti coerenti col modo + `textOnPrimary` (ink scuro `#16240F`-like o bianco) scelto per contrasto AA.

- [ ] **Step 1: Write the failing test**

```ts
// app/src/theme/__tests__/accent.test.ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- accent`
Expected: FAIL ("Cannot find module '../accent'").

- [ ] **Step 3: Implement**

```ts
// app/src/theme/accent.ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- accent` → PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add app/src/theme/accent.ts app/src/theme/__tests__/accent.test.ts
git commit -m "Tema: derivazione accento personalizzato con contrasto AA"
```

---

### Task 3: Persistenza preferenze tema (accento/modo/custom)

**Files:**
- Create: `app/src/theme/themeStorage.ts`
- Modify: `app/src/theme/index.ts`
- Test: `app/src/theme/__tests__/themeStorage.test.ts`
- Test: `app/src/theme/__tests__/ThemeProvider.persist.test.tsx`

**Interfaces:**
- Produces:
  - `loadThemePrefs(): Promise<ThemePrefs>` / `saveThemePrefs(p: ThemePrefs): Promise<void>` con `ThemePrefs = { accent: AccentName | 'custom'; customColor: string | null; mode: ThemeMode | null }`.
  - `useThemeControls()` esteso con `setCustomAccent(hex: string): void` e `accentName: AccentName | 'custom'`, `customColor: string | null`.
  - `buildTheme` usa `deriveAccent` quando l'accento è `custom`.

- [ ] **Step 1: Write the failing test (storage)**

```ts
// app/src/theme/__tests__/themeStorage.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadThemePrefs, saveThemePrefs } from '../themeStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
const get = AsyncStorage.getItem as jest.Mock;
const set = AsyncStorage.setItem as jest.Mock;

beforeEach(() => { get.mockReset(); set.mockReset(); });

it('ritorna default quando non c\'è nulla salvato', async () => {
  get.mockResolvedValue(null);
  await expect(loadThemePrefs()).resolves.toEqual({ accent: 'olive', customColor: null, mode: null });
});

it('salva e rilegge le preferenze', async () => {
  set.mockResolvedValue(undefined);
  await saveThemePrefs({ accent: 'custom', customColor: '#2D5AD9', mode: 'dark' });
  expect(set).toHaveBeenCalledWith('infobucket.theme', JSON.stringify({ accent: 'custom', customColor: '#2D5AD9', mode: 'dark' }));
});

it('ignora JSON corrotto e torna ai default', async () => {
  get.mockResolvedValue('{non-json');
  await expect(loadThemePrefs()).resolves.toEqual({ accent: 'olive', customColor: null, mode: null });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- themeStorage`
Expected: FAIL ("Cannot find module '../themeStorage'").

- [ ] **Step 3: Implement storage**

```ts
// app/src/theme/themeStorage.ts
/**
 * Persistenza delle preferenze di tema (accento, accento personalizzato, modo).
 * Parsing difensivo: dati corrotti → default, mai crash.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccentName, ThemeMode } from './tokens';

const KEY = 'infobucket.theme';

export interface ThemePrefs {
  accent: AccentName | 'custom';
  customColor: string | null;
  mode: ThemeMode | null;
}

const DEFAULTS: ThemePrefs = { accent: 'olive', customColor: null, mode: null };

export async function loadThemePrefs(): Promise<ThemePrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ThemePrefs>;
    return {
      accent: parsed.accent ?? DEFAULTS.accent,
      customColor: typeof parsed.customColor === 'string' ? parsed.customColor : null,
      mode: parsed.mode === 'light' || parsed.mode === 'dark' ? parsed.mode : null,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function saveThemePrefs(prefs: ThemePrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
```

- [ ] **Step 4: Estendere ThemeProvider/useThemeControls**

In `app/src/theme/index.ts`:
- importare `deriveAccent` da `./accent`, `loadThemePrefs`, `saveThemePrefs` da `./themeStorage`, `useEffect` da react.
- estendere `buildTheme(mode, accent, customColor)`: se `accent === 'custom' && customColor`, usare `deriveAccent(customColor, mode)` per sovrascrivere `primary`, `primaryHover`, `primaryPress`, `primarySoft`, `primarySoft2`, `textOnPrimary`, `focusRing`. Altrimenti il comportamento attuale (accento preset).
- nel `ThemeProvider`: stato `accent: AccentName | 'custom'`, `customColor: string | null`. Al mount, `void loadThemePrefs().then(...)` per inizializzarli (+ `modeOverride`). Su ogni cambio, `void saveThemePrefs({ accent, customColor, mode: modeOverride })`.
- `useThemeControls()` ritorna anche `setCustomAccent(hex)` (imposta `accent='custom'`, `customColor=hex`) e i valori `accentName`, `customColor`.
- `Theme.accent` resta l'`AccentName` "effettivo" per i preset; aggiungere `Theme` non è necessario per il custom (le schermate leggono `colors.primary`). La schermata Impostazioni usa `useThemeControls()` per sapere quale chip è attivo.

- [ ] **Step 5: Write the failing test (provider persistence)**

```tsx
// app/src/theme/__tests__/ThemeProvider.persist.test.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';
import { ThemeProvider, useTheme, useThemeControls } from '@/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const wrap = ({ children }: { children: ReactNode }) => createElement(ThemeProvider, null, children);

it('applica un accento personalizzato e lo persiste', async () => {
  const { result } = renderHook(() => ({ theme: useTheme(), controls: useThemeControls() }), { wrapper: wrap });
  await act(async () => { result.current.controls.setCustomAccent('#2D5AD9'); });
  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalled());
  // primary ora deriva dal colore custom (diverso dall'oliva di default)
  expect(result.current.theme.colors.primary.toLowerCase()).not.toBe('#7ca84f');
});
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npm test -- themeStorage ThemeProvider.persist`
Expected: PASS.
Run: `npm run typecheck` → nessun errore.

- [ ] **Step 7: Commit**

```bash
git add app/src/theme/themeStorage.ts app/src/theme/index.ts app/src/theme/__tests__/themeStorage.test.ts app/src/theme/__tests__/ThemeProvider.persist.test.tsx
git commit -m "Tema: accento personalizzato applicato e preferenze persistite"
```

---

### Task 4: Accenti preset estesi + selettore custom in Impostazioni

**Files:**
- Modify: `app/src/theme/tokens.ts` (nuovi accenti)
- Create: `app/src/theme/components/AccentPicker.tsx`
- Modify: `app/src/theme/components/index.ts` (export)
- Modify: `app/app/settings.tsx`
- Test: `app/src/theme/components/__tests__/AccentPicker.test.tsx`
- Test: `app/src/features/settings/__tests__/SettingsScreen.test.tsx` (estendere)

**Interfaces:**
- `AccentPicker`: `<AccentPicker value={string} onChange={(hex) => void} />` — input esadecimale + anteprima swatch + alcune tinte rapide; valida `#RRGGBB`.

- [ ] **Step 1: Aggiungere preset accenti**

In `app/src/theme/tokens.ts`, `accents`: aggiungere alcune tinte (con varianti light/dark esplicite), es.:
```ts
forest: { light: '#2F7D4F', dark: '#5FB880' },
indigo: { light: '#4B4BD6', dark: '#8C8CF0' },
ruby:   { light: '#C0344D', dark: '#E5717F' },
amber:  { light: '#C77D29', dark: '#E5B569' },
```
Aggiornare `ACCENT_LABEL` in `app/app/settings.tsx` con i nomi italiani (`Foresta`, `Indaco`, `Rubino`, `Ambra`).

- [ ] **Step 2: Write the failing test (AccentPicker)**

```tsx
// app/src/theme/components/__tests__/AccentPicker.test.tsx
import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { AccentPicker } from '../AccentPicker';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('chiama onChange con un esadecimale valido', () => {
  const onChange = jest.fn();
  const { getByLabelText } = wrap(<AccentPicker value="#2D5AD9" onChange={onChange} />);
  fireEvent.changeText(getByLabelText('Colore esadecimale'), '#10A37F');
  expect(onChange).toHaveBeenCalledWith('#10A37F');
});

it('ignora un valore non valido', () => {
  const onChange = jest.fn();
  const { getByLabelText } = wrap(<AccentPicker value="#2D5AD9" onChange={onChange} />);
  fireEvent.changeText(getByLabelText('Colore esadecimale'), 'ziogio');
  expect(onChange).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- AccentPicker`
Expected: FAIL ("Cannot find module '../AccentPicker'").

- [ ] **Step 4: Implement AccentPicker**

```tsx
// app/src/theme/components/AccentPicker.tsx
/**
 * AccentPicker — scelta di un colore d'accento personalizzato senza dipendenze
 * esterne: una riga di tinte rapide + un campo esadecimale con anteprima.
 * Valida `#RGB`/`#RRGGBB` e chiama onChange solo su valore valido.
 */
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';

const QUICK = ['#2D5AD9', '#10A37F', '#E5731F', '#C0344D', '#7C5CC4', '#0E7C86'] as const;
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export interface AccentPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function AccentPicker({ value, onChange }: AccentPickerProps): JSX.Element {
  const t = useTheme();
  const [text, setText] = useState(value);

  const commit = (next: string) => {
    setText(next);
    if (HEX.test(next.trim())) onChange(next.trim());
  };

  return (
    <View style={{ gap: t.space[4] }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
        {QUICK.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Tinta ${c}`}
            onPress={() => commit(c)}
            style={{ width: t.touchMin, height: t.touchMin, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ width: 26, height: 26, borderRadius: t.radius.pill, backgroundColor: c, borderWidth: 1.5, borderColor: t.colors.border }} />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
        <View style={{ width: 26, height: 26, borderRadius: t.radius.sm, backgroundColor: HEX.test(text.trim()) ? text.trim() : t.colors.surfaceHover, borderWidth: 1, borderColor: t.colors.border }} />
        <TextInput
          accessibilityLabel="Colore esadecimale"
          value={text}
          onChangeText={commit}
          placeholder="#2D5AD9"
          placeholderTextColor={t.colors.textTertiary}
          autoCapitalize="characters"
          style={{ flex: 1, minHeight: t.touchMin, fontFamily: t.font.mono, fontSize: t.type.body.size, color: t.colors.textPrimary, borderWidth: 1.5, borderColor: t.colors.borderStrong, borderRadius: t.radius.sm, paddingHorizontal: t.space[4] }}
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 5: Cablare in Impostazioni**

In `app/app/settings.tsx`, dentro `AppearanceSection`:
- da `useThemeControls()` prendere anche `setCustomAccent`, `accentName`, `customColor`;
- aggiungere dopo i chip accento un `ChoiceChip`/`AccentChip` "Personalizza" che, quando attivo (`accentName === 'custom'`), mostra l'`<AccentPicker value={customColor ?? '#2D5AD9'} onChange={setCustomAccent} />`;
- esportare `AccentPicker` da `app/src/theme/components/index.ts`.
Aggiornare il test `SettingsScreen.test.tsx` per verificare che esista la voce "Personalizza" (e che i nuovi accenti compaiano).

- [ ] **Step 6: Run tests + typecheck + lint**

Run: `npm test -- AccentPicker SettingsScreen` → PASS.
Run: `npm run typecheck && npm run lint` → puliti.

- [ ] **Step 7: Commit**

```bash
git add app/src/theme/tokens.ts app/src/theme/components/AccentPicker.tsx app/src/theme/components/index.ts app/app/settings.tsx app/src/theme/components/__tests__/AccentPicker.test.tsx app/src/features/settings/__tests__/SettingsScreen.test.tsx
git commit -m "Impostazioni: accenti aggiuntivi + colore personalizzato"
```

---

### Task 5: Barra di provenienza (rail) nella ItemCard

**Files:**
- Modify: `app/src/theme/components/ItemCard.tsx`
- Test: `app/src/theme/components/__tests__/ItemCard.test.tsx` (estendere)

**Interfaces:**
- Nessuna firma cambia: la card disegna una striscia verticale a sinistra nel colore di provenienza (`theme.sourceColor(source).fg`).

- [ ] **Step 1: Write the failing test**

```tsx
// in ItemCard.test.tsx — verifica che esista l'elemento rail con accessibilità nascosta
it('mostra la barra di provenienza nel colore della fonte', () => {
  const { getByTestId } = renderInTheme(<ItemCard source="youtube" summary="x" onPress={() => {}} />);
  const rail = getByTestId('provenance-rail');
  // il colore è quello della fonte video
  const style = Array.isArray(rail.props.style) ? Object.assign({}, ...rail.props.style) : rail.props.style;
  expect(style.backgroundColor).toBeDefined();
});
```
(Usare l'helper `renderInTheme` già presente nel file; se assente, replicare il wrapper `ThemeProvider`.)

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- ItemCard`
Expected: FAIL (nessun `testID="provenance-rail"`).

- [ ] **Step 3: Implement the rail**

In `app/src/theme/components/ItemCard.tsx`:
- aggiungere al `cardStyle` `overflow: 'hidden'` e un `paddingLeft` maggiore (es. `theme.gutter + theme.space[2]`) per fare spazio alla rail.
- come primo figlio di `content`, inserire:
```tsx
<View
  testID="provenance-rail"
  accessibilityElementsHidden
  importantForAccessibility="no-hide-descendants"
  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: theme.sourceColor(source).fg }}
/>
```
- assicurarsi che il contenuto resti leggibile (la rail è dietro/accanto al padding).

- [ ] **Step 4: Run test + typecheck**

Run: `npm test -- ItemCard` → PASS (inclusi i test esistenti).
Run: `npm run typecheck` → nessun errore.

- [ ] **Step 5: Commit**

```bash
git add app/src/theme/components/ItemCard.tsx app/src/theme/components/__tests__/ItemCard.test.tsx
git commit -m "ItemCard: barra di provenienza (elemento firma)"
```

---

### Task 6: Icone reali — loghi brand + favicon articoli + duotone

**Files:**
- Modify: `app/src/theme/icons.tsx` (loghi brand YouTube/TikTok/Instagram; glifi duotone documento/nota)
- Create: `app/src/theme/components/Favicon.tsx`
- Modify: `app/src/theme/components/SourceStamp.tsx`
- Modify: `app/src/lib/source.ts` (helper URL favicon, se non presente)
- Test: `app/src/theme/components/__tests__/Favicon.test.tsx`
- Test: `app/src/theme/components/__tests__/SourceStamp.test.tsx` (estendere)

**Interfaces:**
- `faviconUrl(host: string): string` — URL del servizio favicon (es. `https://www.google.com/s2/favicons?sz=64&domain=<host>`).
- `Favicon`: `<Favicon host={string} size={number} fallback={ReactNode} />` — `Image` che mostra il fallback se l'host manca o l'immagine fallisce.
- `SourceStamp` sceglie: logo brand (youtube/reel/tiktok), favicon (article con URL/host), glifo duotone (document/note o article senza host).

- [ ] **Step 1: Write the failing test (Favicon)**

```tsx
// app/src/theme/components/__tests__/Favicon.test.tsx
import { createElement, type ReactNode } from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { Favicon } from '../Favicon';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra il fallback se manca l\'host', () => {
  const { getByText } = wrap(<Favicon host={null} size={24} fallback={<Text>FB</Text>} />);
  expect(getByText('FB')).toBeTruthy();
});

it('mostra il fallback se l\'immagine fallisce', () => {
  const { getByText, getByTestId } = wrap(<Favicon host="theatlantic.com" size={24} fallback={<Text>FB</Text>} />);
  fireEvent(getByTestId('favicon-image'), 'error');
  expect(getByText('FB')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Favicon`
Expected: FAIL ("Cannot find module '../Favicon'").

- [ ] **Step 3: Implement Favicon + helper**

In `app/src/lib/source.ts` aggiungere (se non presente):
```ts
/** URL della favicon del dominio (servizio pubblico Google). */
export function faviconUrl(host: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;
}
```

```tsx
// app/src/theme/components/Favicon.tsx
/**
 * Favicon — mostra il logo reale del sito di un articolo. Se l'host manca o
 * l'immagine non carica (rete ostile/offline), mostra il fallback fornito.
 * Degrada con grazia: una favicon che non arriva non rompe mai la card.
 */
import { useState, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import { faviconUrl } from '@/lib/source';

export interface FaviconProps {
  host: string | null;
  size: number;
  fallback: ReactNode;
}

export function Favicon({ host, size, fallback }: FaviconProps): JSX.Element {
  const [failed, setFailed] = useState(false);
  if (!host || failed) return <>{fallback}</>;
  return (
    <View style={{ width: size, height: size }}>
      <Image
        testID="favicon-image"
        source={{ uri: faviconUrl(host) }}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: 4 }}
      />
    </View>
  );
}
```

- [ ] **Step 4: Loghi brand + duotone in icons.tsx**

In `app/src/theme/icons.tsx` aggiungere componenti icona per i loghi reali (`YouTubeLogo`, `TikTokLogo`, `InstagramLogo`) con i path SVG ufficiali a colori, e glifi duotone `DocumentGlyph`, `NoteGlyph`, `ArticleGlyph`. Seguire la firma `IconComponent` esistente (props `size`, `color`) dove sensato; i loghi brand ignorano `color` (sono multicolore).

- [ ] **Step 5: SourceStamp sceglie la rappresentazione**

In `app/src/theme/components/SourceStamp.tsx`, in base a `source` (+ `host` opzionale ricavato dall'URL):
- youtube → `YouTubeLogo`; reel → `InstagramLogo`; tiktok → `TikTokLogo`;
- article → `<Favicon host={host} fallback={<ArticleGlyph .../>} />`;
- document → `DocumentGlyph`; other/note → `NoteGlyph`.
Aggiungere una prop opzionale `host?: string | null` a `SourceStamp` e passarla da `ItemCard`/`ReviewScreen` (che già calcolano l'hostname con `hostnameOf`). Esportare `Favicon` da `index.ts`. Aggiornare i test di `SourceStamp` alle nuove rappresentazioni (verificare che per `youtube` compaia il logo, per `article` con host compaia l'immagine favicon con testID, ecc.).

- [ ] **Step 6: Run tests + typecheck + lint**

Run: `npm test -- Favicon SourceStamp ItemCard` → PASS.
Run: `npm run typecheck && npm run lint` → puliti.

- [ ] **Step 7: Commit**

```bash
git add app/src/theme/icons.tsx app/src/theme/components/Favicon.tsx app/src/theme/components/SourceStamp.tsx app/src/theme/components/index.ts app/src/lib/source.ts app/src/theme/components/__tests__/Favicon.test.tsx app/src/theme/components/__tests__/SourceStamp.test.tsx
git commit -m "Icone: loghi brand reali + favicon articoli + glifi duotone"
```

---

### Task 7: Header editoriale condiviso (ScreenHeader)

**Files:**
- Create: `app/src/theme/components/ScreenHeader.tsx`
- Modify: `app/src/theme/components/index.ts`
- Modify: `app/app/(tabs)/index.tsx`, `library.tsx`, `search.tsx`
- Test: `app/src/theme/components/__tests__/ScreenHeader.test.tsx`

**Interfaces:**
- `ScreenHeader`: `<ScreenHeader kicker?={string} title={string} right?={ReactNode} />` — occhiello mono opzionale + titolo grande (display ~29) + slot azioni a destra.

- [ ] **Step 1: Write the failing test**

```tsx
// app/src/theme/components/__tests__/ScreenHeader.test.tsx
import { createElement, type ReactNode } from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ScreenHeader } from '../ScreenHeader';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra occhiello, titolo e slot destro', () => {
  const { getByText } = wrap(<ScreenHeader kicker="Da rivedere" title="Inbox" right={<Text>R</Text>} />);
  expect(getByText('Da rivedere')).toBeTruthy();
  expect(getByText('Inbox')).toBeTruthy();
  expect(getByText('R')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- ScreenHeader`
Expected: FAIL ("Cannot find module '../ScreenHeader'").

- [ ] **Step 3: Implement**

```tsx
// app/src/theme/components/ScreenHeader.tsx
/**
 * ScreenHeader — l'header editoriale condiviso: occhiello mono opzionale,
 * titolo grande (Bricolage display) e uno slot azioni a destra (es. AvatarMenu).
 * Stile dal tema.
 */
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

export interface ScreenHeaderProps {
  kicker?: string;
  title: string;
  right?: ReactNode;
}

export function ScreenHeader({ kicker, title, right }: ScreenHeaderProps): JSX.Element {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingTop: t.space[4], paddingBottom: t.space[3] }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {kicker ? (
          <Text style={{ fontFamily: t.font.mono, fontSize: t.type.meta.size, letterSpacing: t.type.meta.size * t.type.meta.tracking, textTransform: 'uppercase', color: t.colors.textTertiary, marginBottom: t.space[2] }}>
            {kicker}
          </Text>
        ) : null}
        <Text style={{ fontFamily: t.font.displayBold, fontSize: t.type.display.size, lineHeight: t.type.display.lh, color: t.colors.textPrimary }}>
          {title}
        </Text>
      </View>
      {right ? <View style={{ marginLeft: t.space[3] }}>{right}</View> : null}
    </View>
  );
}
```

- [ ] **Step 4: Usare ScreenHeader nelle tre tab**

In `index.tsx` (Inbox): sostituire la riga header attuale con `<ScreenHeader kicker={...} title="Inbox" right={<><ArchivioPressable/><AvatarMenu/></>} />`. L'occhiello può essere dinamico (es. conteggio "N da rivedere") o assente. Mantenere Archivio + AvatarMenu nello slot `right`.
In `library.tsx`: `<ScreenHeader title="Libreria" right={<><Button Nuovo bucket/><AvatarMenu/></>} />`.
In `search.tsx`: `<ScreenHeader title="Cerca" right={<AvatarMenu/>} />` sopra al `TextField` di ricerca.
Esportare `ScreenHeader` da `index.ts`. Adeguare eventuali test delle schermate che cercavano il vecchio header (il testo del titolo resta).

- [ ] **Step 5: Run tests + typecheck + lint**

Run: `npm test -- ScreenHeader` → PASS.
Run: `npm run typecheck && npm run lint` → puliti.

- [ ] **Step 6: Commit**

```bash
git add app/src/theme/components/ScreenHeader.tsx app/src/theme/components/index.ts app/app/\(tabs\)/ app/src/theme/components/__tests__/ScreenHeader.test.tsx
git commit -m "UI: header editoriale condiviso (occhiello + titolo grande)"
```

---

### Task 8: Wordmark + brand al login e allo splash

**Files:**
- Create: `app/src/theme/components/Wordmark.tsx`
- Modify: `app/src/theme/components/index.ts`
- Modify: `app/app/login.tsx`
- Modify: `app/app/_layout.tsx` (SplashLoader)
- Test: `app/src/theme/components/__tests__/Wordmark.test.tsx`

**Interfaces:**
- `Wordmark`: `<Wordmark size?={'lg' | 'sm'} />` — glifo a trattini-provenienza (4 tacche nei colori `src`) + logotype "InfoBucket" in Bricolage.

- [ ] **Step 1: Write the failing test**

```tsx
// app/src/theme/components/__tests__/Wordmark.test.tsx
import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { Wordmark } from '../Wordmark';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra il logotype InfoBucket', () => {
  const { getByText } = wrap(<Wordmark />);
  expect(getByText('InfoBucket')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Wordmark`
Expected: FAIL ("Cannot find module '../Wordmark'").

- [ ] **Step 3: Implement**

```tsx
// app/src/theme/components/Wordmark.tsx
/**
 * Wordmark — il marchio di InfoBucket: il glifo a trattini-provenienza (le
 * famiglie di fonti a colori) accanto/sopra il logotype in Bricolage. Usato nel
 * login e nello splash. Stile dal tema.
 */
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

export interface WordmarkProps {
  size?: 'lg' | 'sm';
}

const TICKS: { key: string; h: number }[] = [
  { key: 'article', h: 14 },
  { key: 'video', h: 22 },
  { key: 'social', h: 18 },
  { key: 'document', h: 26 },
];

export function Wordmark({ size = 'lg' }: WordmarkProps): JSX.Element {
  const t = useTheme();
  const fontSize = size === 'lg' ? t.type.display.size : t.type.title.size;
  return (
    <View style={{ gap: t.space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 28 }}>
        {TICKS.map((tick) => (
          <View key={tick.key} style={{ width: 7, height: tick.h, borderRadius: 3, backgroundColor: t.colors.src[tick.key as keyof typeof t.colors.src] }} />
        ))}
      </View>
      <Text style={{ fontFamily: t.font.displayBold, fontSize, letterSpacing: -0.5, color: t.colors.textPrimary }}>
        InfoBucket
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: Usare nel login e nello splash**

In `app/app/login.tsx`: sostituire il blocco titolo testuale "InfoBucket" con `<Wordmark />` (mantenendo il sottotitolo "Accedi per continuare." / "Crea il tuo account.").
In `app/app/_layout.tsx`, `SplashLoader`: mostrare `<Wordmark />` centrato sopra (o al posto di) l'`ActivityIndicator`. Esportare `Wordmark` da `index.ts`.

- [ ] **Step 5: Run tests + typecheck + lint**

Run: `npm test -- Wordmark` → PASS.
Run: `npm run typecheck && npm run lint` → puliti.

- [ ] **Step 6: Commit**

```bash
git add app/src/theme/components/Wordmark.tsx app/src/theme/components/index.ts app/app/login.tsx app/app/_layout.tsx app/src/theme/components/__tests__/Wordmark.test.tsx
git commit -m "Brand: wordmark InfoBucket nel login e nello splash"
```

---

### Task 9: Verifica finale + CODE_MAP

**Files:**
- Modify: `docs/CODE_MAP.md`

- [ ] **Step 1: Suite completa**

Run: `npm test` → tutti verdi.
Run: `npm run typecheck && npm run lint` → nessun errore/warning.

- [ ] **Step 2: Aggiornare CODE_MAP**

Aggiungere: `theme/accent.ts`, `theme/themeStorage.ts`, componenti `AccentPicker`, `Favicon`, `ScreenHeader`, `Wordmark`; annotare i temi Cloud/Ink, l'accento personalizzato persistito, la rail di provenienza, i loghi reali/favicon.

- [ ] **Step 3: Commit**

```bash
git add docs/CODE_MAP.md
git commit -m "Docs: CODE_MAP riflette il redesign visivo (temi, accento, icone, brand)"
```

---

## Self-Review

**Spec coverage (vs spec §4):**
- §4.1 firma provenienza → Task 5. ✔
- §4.2 temi Cloud/Ink → Task 1. ✔
- §4.3 accento esteso + custom + persistenza → Task 2-4. ✔
- §4.4 header editoriale → Task 7. ✔
- §4.5 icone reali/favicon/duotone → Task 6. ✔
- §4.6 brand login/splash → Task 8. ✔
- Minor del Piano 1 (scrim hardcoded) → risolto in Task 1.

**Placeholder scan:** i path SVG esatti dei loghi brand (Task 6 Step 4) e il dettaglio dei glifi duotone sono descritti, non incollati: l'implementatore disegna SVG standard dei marchi (forme note) seguendo la firma `IconComponent`. È l'unico punto "da disegnare"; tutto il resto ha codice completo.

**Type consistency:** `deriveAccent`/`AccentVariants`, `ThemePrefs`, `faviconUrl`, `Favicon`, `ScreenHeader`, `Wordmark`, `AccentPicker` usati con le firme con cui sono definiti. `useThemeControls` esteso (Task 3) prima dell'uso in Impostazioni (Task 4).

## Note
- Nessuna nuova dipendenza runtime (favicon via `Image`, color picker via `TextInput`).
- I valori soft dell'accento custom sono derivati (Task 2); per i preset restano quelli espliciti dei token.
