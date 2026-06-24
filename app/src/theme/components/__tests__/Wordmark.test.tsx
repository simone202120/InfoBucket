import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { Wordmark } from '../Wordmark';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra il logotype InfoBucket', () => {
  const { getByText } = wrap(<Wordmark />);
  expect(getByText('InfoBucket')).toBeTruthy();
});
