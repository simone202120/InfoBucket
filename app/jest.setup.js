// Setup globale dei test dell'app.
// Polyfill richiesto da @supabase/supabase-js in ambiente React Native/Jest.
require('react-native-url-polyfill/auto');

// Mock dei moduli nativi di react-native-gesture-handler (Swipeable nelle card).
require('react-native-gesture-handler/jestSetup');

// Mock di default per AsyncStorage: il ThemeProvider idrata le preferenze al
// mount, quindi ogni test che lo monta ne ha bisogno. I test che verificano la
// persistenza forniscono il proprio mock con jest.mock locale.
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock di default per expo-haptics: il wrapper `haptics` è "fire and forget" e
// in ambiente test non c'è motore aptico. I test che lo verificano usano il
// proprio jest.mock locale.
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}));
