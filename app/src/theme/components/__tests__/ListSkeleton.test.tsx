import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ListSkeleton } from '../ListSkeleton';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('rende il numero richiesto di placeholder', () => {
  const { getAllByLabelText } = wrap(<ListSkeleton count={3} />);
  expect(getAllByLabelText('Caricamento')).toHaveLength(3);
});
