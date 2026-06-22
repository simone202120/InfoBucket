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
    // Lo share intent ACTION_SEND verrà aggiunto in Fase 7 (richiede dev/prod build EAS).
  },
  plugins: ['expo-router', 'expo-font'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
