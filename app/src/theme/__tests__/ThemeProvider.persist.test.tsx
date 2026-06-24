import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';
import { ThemeProvider, useTheme, useThemeControls } from '@/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const wrap = ({ children }: { children: ReactNode }) => createElement(ThemeProvider, null, children);

it('applica un accento personalizzato e lo persiste', async () => {
  const { result } = renderHook(() => ({ theme: useTheme(), controls: useThemeControls() }), { wrapper: wrap });
  await act(async () => { result.current.controls.setCustomAccent('#2D5AD9'); });
  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalled());
  // primary ora deriva dal colore custom (diverso dall'oliva di default)
  expect(result.current.theme.colors.primary.toLowerCase()).not.toBe('#7ca84f');
});
