import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { TranscriptSheet } from '../TranscriptSheet';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra titolo e testo quando visibile', () => {
  const { getByText } = wrap(
    <TranscriptSheet visible title="Trascrizione" text="Testo completo qui." onClose={() => {}} />,
  );
  expect(getByText('Trascrizione')).toBeTruthy();
  expect(getByText('Testo completo qui.')).toBeTruthy();
});
