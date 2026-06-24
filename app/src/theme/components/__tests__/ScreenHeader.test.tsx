import { createElement, type ReactNode } from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ScreenHeader } from '../ScreenHeader';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra occhiello, titolo e slot destro', () => {
  const { getByText } = wrap(<ScreenHeader kicker="Da rivedere" title="Inbox" right={<Text>R</Text>} />);
  expect(getByText('Da rivedere')).toBeTruthy();
  expect(getByText('Inbox')).toBeTruthy();
  expect(getByText('R')).toBeTruthy();
});
