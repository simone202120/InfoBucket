/**
 * Adapter del design system — UNICO punto che l'app conosce per lo stile.
 * Le schermate importano da qui (`useTheme`, `ThemeProvider`), mai dai token grezzi.
 * Se un domani cambia il formato del design system, si aggiorna solo questo file.
 * Vedi infobucket-spec.md §13.
 */
import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  accents,
  color,
  font,
  gutter,
  radius,
  shadow,
  space,
  touchMin,
  type,
  weight,
  type AccentName,
  type ThemeMode,
} from './tokens';
import { deriveAccent } from './accent';
import { loadThemePrefs, saveThemePrefs } from './themeStorage';
import type { SourceType } from '../types/domain';

/** Accento selezionato: un preset oppure il colore personalizzato dell'utente. */
export type AccentChoice = AccentName | 'custom';

/** Mappa il source_type di dominio alla famiglia cromatica di provenienza. */
const SOURCE_COLOR_KEY: Record<SourceType, keyof typeof color.light.src> = {
  article: 'article',
  youtube: 'video',
  reel: 'social',
  tiktok: 'social',
  document: 'document',
  other: 'note',
};

/** Interfaccia stabile esposta a tutta l'app. */
export interface Theme {
  mode: ThemeMode;
  accent: AccentChoice;
  colors: (typeof color)['light'];
  shadow: (typeof shadow)['light'];
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  font: typeof font;
  weight: typeof weight;
  gutter: number;
  touchMin: number;
  /** Colore di provenienza per una fonte (stamp). */
  sourceColor(source: SourceType): { fg: string; soft: string };
}

function buildTheme(mode: ThemeMode, accent: AccentChoice, customColor: string | null): Theme {
  const base = color[mode];
  // L'accento utente sovrascrive il gruppo primary; lo status resta sempre fisso.
  // Per un preset cambia solo `primary`; per il colore personalizzato deriviamo
  // tutte le varianti (hover/press/soft) e il testo a contrasto AA.
  const accentGroup =
    accent === 'custom' && customColor
      ? (() => {
          const v = deriveAccent(customColor, mode);
          return {
            primary: v.primary,
            primaryHover: v.primaryHover,
            primaryPress: v.primaryPress,
            primarySoft: v.primarySoft,
            primarySoft2: v.primarySoft2,
            textOnPrimary: v.textOnPrimary,
            focusRing: v.primary,
          };
        })()
      : (() => {
          const primary = accents[accent === 'custom' ? 'olive' : accent][mode];
          return { primary, focusRing: primary };
        })();
  const colors = { ...base, ...accentGroup };
  return {
    mode,
    accent,
    colors,
    shadow: shadow[mode],
    space,
    radius,
    type,
    font,
    weight,
    gutter,
    touchMin,
    sourceColor(source) {
      const key = SOURCE_COLOR_KEY[source];
      return { fg: colors.src[key], soft: colors.src[`${key}Soft` as keyof typeof colors.src] };
    },
  };
}

interface ThemeController {
  theme: Theme;
  /** Sceglie un accento preset (azzera l'eventuale colore personalizzato). */
  setAccent(a: AccentName): void;
  /** Imposta un accento personalizzato da un colore esadecimale. */
  setCustomAccent(hex: string): void;
  setModeOverride(m: ThemeMode | null): void;
  modeOverride: ThemeMode | null;
  /** Accento attivo (preset o 'custom'), per evidenziare il chip in Impostazioni. */
  accentName: AccentChoice;
  customColor: string | null;
}

const ThemeContext = createContext<ThemeController | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  defaultAccent?: AccentName;
  /** Forza un tema; se null segue il sistema. */
  defaultMode?: ThemeMode | null;
}

export function ThemeProvider({ children, defaultAccent = 'olive', defaultMode = null }: ThemeProviderProps) {
  const system = useColorScheme();
  const [accent, setAccentState] = useState<AccentChoice>(defaultAccent);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [modeOverride, setModeOverride] = useState<ThemeMode | null>(defaultMode);
  // L'idratazione è asincrona: se l'utente cambia tema prima che finisca, la sua
  // scelta vince (non la sovrascriviamo con i valori salvati appena arrivano).
  const touched = useRef(false);

  // Idrata le preferenze salvate al primo mount (parsing difensivo nello storage).
  useEffect(() => {
    let active = true;
    void loadThemePrefs().then((p) => {
      if (!active || touched.current) return;
      setAccentState(p.accent);
      setCustomColor(p.customColor);
      setModeOverride(p.mode);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ThemeController>(() => {
    const mode: ThemeMode = modeOverride ?? (system === 'dark' ? 'dark' : 'light');
    // I setter persistono direttamente la nuova preferenza: nessuna scrittura
    // ridondante al mount e niente race con l'idratazione.
    const setAccent = (a: AccentName) => {
      touched.current = true;
      setAccentState(a);
      setCustomColor(null);
      void saveThemePrefs({ accent: a, customColor: null, mode: modeOverride });
    };
    const setCustomAccent = (hex: string) => {
      touched.current = true;
      setAccentState('custom');
      setCustomColor(hex);
      void saveThemePrefs({ accent: 'custom', customColor: hex, mode: modeOverride });
    };
    const setMode = (m: ThemeMode | null) => {
      touched.current = true;
      setModeOverride(m);
      void saveThemePrefs({ accent, customColor, mode: m });
    };
    return {
      theme: buildTheme(mode, accent, customColor),
      setAccent,
      setCustomAccent,
      setModeOverride: setMode,
      modeOverride,
      accentName: accent,
      customColor,
    };
  }, [accent, customColor, modeOverride, system]);

  return createElement(ThemeContext.Provider, { value }, children);
}

/** Hook principale: ritorna il tema corrente. */
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve essere usato dentro <ThemeProvider>');
  return ctx.theme;
}

/** Controlli del tema (accento, override chiaro/scuro) per la schermata Impostazioni. */
export function useThemeControls(): Omit<ThemeController, 'theme'> {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls deve essere usato dentro <ThemeProvider>');
  const { setAccent, setCustomAccent, setModeOverride, modeOverride, accentName, customColor } = ctx;
  return { setAccent, setCustomAccent, setModeOverride, modeOverride, accentName, customColor };
}

export { accents } from './tokens';
export type { AccentName, ThemeMode } from './tokens';
export { FadeInUp, PressableScale, useReducedMotion, staggerDelay, MOTION } from './motion';
export { ToastProvider, useToast } from './ToastProvider';
