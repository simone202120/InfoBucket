import { renderHook } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/theme';

const wrap = ({ children }: { children: ReactNode }) => createElement(ThemeProvider, null, children);

it('espone il colore scrim dal tema', () => {
  const { result } = renderHook(() => useTheme(), { wrapper: wrap });
  expect(typeof result.current.colors.scrim).toBe('string');
  expect(result.current.colors.scrim.length).toBeGreaterThan(0);
});
