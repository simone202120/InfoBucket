/**
 * Token del design system, portati su JS da "InfoBucket Design System"/tokens/*.css.
 * Questa è l'UNICA copia dei valori grezzi: i componenti non li toccano direttamente,
 * passano dall'adapter (index.ts). Tenere in sync con i .css se cambiano.
 */

export interface SrcColors {
  article: string; articleSoft: string;
  video: string; videoSoft: string;
  social: string; socialSoft: string;
  document: string; documentSoft: string;
  note: string; noteSoft: string;
}
export interface StatusColors {
  processing: string; processingSoft: string;
  ready: string; readySoft: string;
  saved: string; savedSoft: string;
  archived: string; archivedSoft: string;
  expiring: string; expiringSoft: string;
}
export interface ColorScheme {
  bg: string; bgSunken: string;
  surface: string; surfaceRaised: string; surfaceHover: string;
  textPrimary: string; textSecondary: string; textTertiary: string;
  textOnPrimary: string; textOnAccent: string;
  primary: string; primaryHover: string; primaryPress: string; primarySoft: string; primarySoft2: string;
  accent: string; accentSoft: string;
  border: string; borderStrong: string; focusRing: string;
  /** Tinta dei veli (backdrop dei modali); usata con bassa opacità. */
  scrim: string;
  success: string; successSoft: string;
  warning: string; warningSoft: string;
  danger: string; dangerHover: string; dangerSoft: string;
  src: SrcColors;
  status: StatusColors;
}

/** Colori semantici per tema. `primary` è sovrascritto dall'accento utente (vedi accents). */
export const color: Record<'light' | 'dark', ColorScheme> = {
  light: {
    bg: '#F5F6F8',
    bgSunken: '#E7EAEE',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceHover: '#F0F2F5',
    textPrimary: '#191F26',
    textSecondary: '#5C6773',
    textTertiary: '#9098A3',
    textOnPrimary: '#16240F',
    textOnAccent: '#FFFFFF',
    primary: '#7CA84F',
    primaryHover: '#6E9A43',
    primaryPress: '#5E8638',
    primarySoft: '#ECF1DE',
    primarySoft2: '#D9E6C2',
    accent: '#C77D29',
    accentSoft: '#F6E7D2',
    border: '#E4E7EB',
    borderStrong: '#CBD2D9',
    focusRing: '#7CA84F',
    scrim: '#16202B',
    success: '#2F8F5B',
    successSoft: '#DDEFE4',
    warning: '#C77D29',
    warningSoft: '#F6E7D2',
    danger: '#C24338',
    dangerHover: '#A8362C',
    dangerSoft: '#F7DEDB',
    src: {
      article: '#3B6EA5',
      articleSoft: '#DEE8F2',
      video: '#C8453C',
      videoSoft: '#F6DEDC',
      social: '#7C5CC4',
      socialSoft: '#E7DFF5',
      document: '#3F8F6B',
      documentSoft: '#DCEEE5',
      note: '#5B6878',
      noteSoft: '#E4E9EE',
    },
    status: {
      processing: '#7C8A99',
      processingSoft: '#E7ECF1',
      ready: '#5E8E2E',
      readySoft: '#EAF1DC',
      saved: '#2F8F5B',
      savedSoft: '#DDEFE4',
      archived: '#8995A3',
      archivedSoft: '#E7ECF1',
      expiring: '#C77D29',
      expiringSoft: '#F6E7D2',
    },
  },
  dark: {
    bg: '#0F1217',
    bgSunken: '#0A0D12',
    surface: '#181D24',
    surfaceRaised: '#212833',
    surfaceHover: '#1E242C',
    textPrimary: '#ECF1F6',
    textSecondary: '#9AA6B2',
    textTertiary: '#646F7A',
    textOnPrimary: '#0C1A0F',
    textOnAccent: '#1B1206',
    primary: '#9CC57E',
    primaryHover: '#ACD08F',
    primaryPress: '#8AB76B',
    primarySoft: '#1E2D17',
    primarySoft2: '#2A3D20',
    accent: '#E0A24C',
    accentSoft: '#36281550',
    border: '#252C35',
    borderStrong: '#36404B',
    focusRing: '#9CC57E',
    scrim: '#000000',
    success: '#4FB47C',
    successSoft: '#16301F',
    warning: '#E0A24C',
    warningSoft: '#33260F',
    danger: '#E2675C',
    dangerHover: '#ED7A70',
    dangerSoft: '#381A18',
    src: {
      article: '#6FA3D6',
      articleSoft: '#16273A',
      video: '#E26A60',
      videoSoft: '#381C1A',
      social: '#A88BE0',
      socialSoft: '#251C3A',
      document: '#5FB68A',
      documentSoft: '#15301F',
      note: '#9DAAB8',
      noteSoft: '#232E3A',
    },
    status: {
      processing: '#8B98A6',
      processingSoft: '#232E3A',
      ready: '#8FBE6A',
      readySoft: '#1E2D17',
      saved: '#4FB47C',
      savedSoft: '#16301F',
      archived: '#6C7A89',
      archivedSoft: '#1E2832',
      expiring: '#E0A24C',
      expiringSoft: '#33260F',
    },
  },
};

/** Accenti selezionabili dall'utente: sovrascrivono `primary`. Lo status non cambia mai. */
export const accents = {
  olive: { light: '#7CA84F', dark: '#9CC57E' },
  cobalt: { light: '#2D5AD9', dark: '#6E92F2' },
  seafoam: { light: '#12A199', dark: '#52C6BE' },
  blush: { light: '#DC6F94', dark: '#EF9CB7' },
  tangerine: { light: '#E5731F', dark: '#F19A4E' },
  oxblood: { light: '#8E2E3C', dark: '#D06672' },
} as const;

export type AccentName = keyof typeof accents;
export type ThemeMode = 'light' | 'dark';

/** Famiglie font (caricate via @expo-google-fonts). */
export const font = {
  display: 'BricolageGrotesque_500Medium',
  displayBold: 'BricolageGrotesque_700Bold',
  read: 'Newsreader_400Regular',
  readMedium: 'Newsreader_500Medium',
  mono: 'SpaceMono_400Regular',
} as const;

export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extra: '800',
} as const;

/** Scala tipografica: [fontSize, lineHeight] in px. */
export const type = {
  display: { size: 32, lh: 36 },
  title: { size: 24, lh: 30 },
  heading: { size: 19, lh: 25 },
  subheading: { size: 16, lh: 22 },
  readLg: { size: 19, lh: 29 },
  read: { size: 16, lh: 25 },
  readSm: { size: 15, lh: 23 },
  body: { size: 15, lh: 21 },
  bodySm: { size: 13, lh: 18 },
  label: { size: 12, lh: 16, tracking: 0.04 },
  meta: { size: 11, lh: 15, tracking: 0.06 },
  micro: { size: 10, lh: 13, tracking: 0.08 },
} as const;

/** Scala spaziature 4pt. */
export const space = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
  12: 64,
} as const;

export const gutter = 16;
export const touchMin = 44;

export const radius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export interface ShadowStyle {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}
export interface ShadowSet {
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
}

/** Ombre (RN: oggetti style per elevation). Cool-tinted, soft. */
export const shadow: Record<'light' | 'dark', ShadowSet> = {
  light: {
    sm: { shadowColor: '#16202B', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    md: { shadowColor: '#16202B', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    lg: { shadowColor: '#16202B', shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  },
  dark: {
    sm: { shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    md: { shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    lg: { shadowColor: '#000000', shadowOpacity: 0.55, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  },
};
