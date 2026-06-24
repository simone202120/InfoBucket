import { createElement, type ReactNode } from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { Favicon } from '../Favicon';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra il fallback se manca l\'host', () => {
  const { getByText } = wrap(<Favicon host={null} size={24} fallback={<Text>FB</Text>} />);
  expect(getByText('FB')).toBeTruthy();
});

it('mostra il fallback se l\'immagine fallisce', () => {
  const { getByText, getByTestId } = wrap(<Favicon host="theatlantic.com" size={24} fallback={<Text>FB</Text>} />);
  fireEvent(getByTestId('favicon-image'), 'error');
  expect(getByText('FB')).toBeTruthy();
});
