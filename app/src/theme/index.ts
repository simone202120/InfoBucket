/**
 * Adapter del design system — UNICO punto che l'app conosce per lo stile.
 * Le schermate importano da qui (`useTheme`, `ThemeProvider`), mai dai token grezzi.
 * Se un domani cambia il formato del design system, si aggiorna solo questo file.
 * Vedi infobucket-spec.md §13.
 */
import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from 'react';
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
import type { SourceType } from '../types/domain';

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
  accent: AccentName;
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

function buildTheme(mode: ThemeMode, accent: AccentName): Theme {
  const base = color[mode];
  // L'accento utente sovrascrive solo il gruppo primary; lo status resta fisso.
  const primary = accents[accent][mode];
  const colors = { ...base, primary, focusRing: primary };
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
  setAccent(a: AccentName): void;
  setModeOverride(m: ThemeMode | null): void;
  modeOverride: ThemeMode | null;
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
  const [accent, setAccent] = useState<AccentName>(defaultAccent);
  const [modeOverride, setModeOverride] = useState<ThemeMode | null>(defaultMode);

  const value = useMemo<ThemeController>(() => {
    const mode: ThemeMode = modeOverride ?? (system === 'dark' ? 'dark' : 'light');
    return { theme: buildTheme(mode, accent), setAccent, setModeOverride, modeOverride };
  }, [accent, modeOverride, system]);

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
  const { setAccent, setModeOverride, modeOverride } = ctx;
  return { setAccent, setModeOverride, modeOverride };
}

export { accents } from './tokens';
export type { AccentName, ThemeMode } from './tokens';
export { FadeInUp, PressableScale, useReducedMotion, staggerDelay, MOTION } from './motion';
export { ToastProvider, useToast } from './ToastProvider';
