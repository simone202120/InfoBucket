// Setup globale dei test dell'app.
// Polyfill richiesto da @supabase/supabase-js in ambiente React Native/Jest.
require('react-native-url-polyfill/auto');

// Mock di default per AsyncStorage: il ThemeProvider idrata le preferenze al
// mount, quindi ogni test che lo monta ne ha bisogno. I test che verificano la
// persistenza forniscono il proprio mock con jest.mock locale.
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
