// app/src/theme/__tests__/ToastProvider.test.tsx
import { createElement } from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme';
import { ToastProvider, useToast } from '../ToastProvider';

// Metriche di schermo minimali richieste da useSafeAreaInsets nei test.
const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function Trigger() {
  const { showToast } = useToast();
  return createElement(Pressable, { onPress: () => showToast({ message: 'Salvato in «Cucina»' }) },
    createElement(Text, null, 'mostra'));
}

it('mostra il messaggio del toast quando richiesto', () => {
  render(
    createElement(
      SafeAreaProvider,
      { initialMetrics: safeAreaMetrics },
      createElement(ThemeProvider, null, createElement(ToastProvider, null, createElement(Trigger))),
    ),
  );
  expect(screen.queryByText('Salvato in «Cucina»')).toBeNull();
  fireEvent.press(screen.getByText('mostra'));
  expect(screen.getByText('Salvato in «Cucina»')).toBeTruthy();
});
