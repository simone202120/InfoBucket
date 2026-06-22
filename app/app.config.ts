import type { ExpoConfig } from 'expo/config';

/**
 * Configurazione Expo. Target v1: solo Android (APK via EAS).
 * Nessun segreto qui: solo le EXPO_PUBLIC_* (URL + anon key) sono lato client.
 */
const config: ExpoConfig = {
  name: 'InfoBucket',
  slug: 'infobucket',
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
  ],
  experiments: {
    typedRoutes: true,
  },
  // Identità del progetto EAS (build APK in cloud). Solo riferimenti pubblici,
  // nessun segreto: le EXPO_PUBLIC_* sono iniettate da EAS al momento della build.
  owner: 'simon2021',
  extra: {
    eas: {
      projectId: 'abd8c06b-122a-452d-b3bc-af7abcef3215',
    },
  },
};

export default config;
