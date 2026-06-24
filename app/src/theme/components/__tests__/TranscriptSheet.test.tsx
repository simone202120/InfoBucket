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

it('non rende il contenuto quando non visibile', () => {
  const { queryByText } = wrap(
    <TranscriptSheet visible={false} title="Trascrizione" text="Testo completo qui." onClose={() => {}} />,
  );
  expect(queryByText('Trascrizione')).toBeNull();
  expect(queryByText('Testo completo qui.')).toBeNull();
});
