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
