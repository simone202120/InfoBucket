import type { ExpoConfig } from 'expo/config';

/**
 * Configurazione Expo. Target v1: solo Android (APK via EAS).
 * Nessun segreto qui: solo le EXPO_PUBLIC_* (URL + anon key) sono lato client.
 */
const config: ExpoConfig = {
  name: 'InfoBucket',
  slug: 'infobucket',
  owner: 'simon2021',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'infobucket',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  android: {
    package: 'com.infobucket.app',
  },
  // Target v1 è solo Android, ma il config plugin di expo-share-intent valuta
  // anche il ramo iOS in fase di `expo start` e richiede un bundleIdentifier:
  // senza, la risoluzione della config fallisce (anche per Expo Go). Lo definiamo
  // per coerenza con l'identità Android, pur non spedendo su iOS in v1.
  ios: {
    bundleIdentifier: 'com.infobucket.app',
  },
  plugins: [
    'expo-router',
    'expo-font',
    // Share intent Android (§12): riceve link/testo condivisi da altre app.
    // Richiede una dev/production build EAS (non funziona in Expo Go).
    ['expo-share-intent', { androidIntentFilters: ['text/*'] }],
    // Limita il build nativo ad arm64-v8a: con le 4 ABI di default il worker EAS
    // andava in out-of-memory durante la compilazione C++ (vedi il plugin).
    './plugins/withAndroidReleaseTuning',
  ],
  experiments: {
    typedRoutes: true,
  },
  // Collega il progetto a EAS (necessario per il "Build from GitHub", che gira
  // non-interattivo). Nessun segreto: il projectId è un identificatore pubblico.
  extra: {
    eas: {
      projectId: 'abd8c06b-122a-452d-b3bc-af7abcef3215',
    },
  },
};

export default config;
