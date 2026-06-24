import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { AvatarMenu } from '../AvatarMenu';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra le iniziali dell\'email', () => {
  const { getByText } = wrap(<AvatarMenu email="simo.lavoro@gmail.com" onOpenSettings={() => {}} onSignOut={() => {}} />);
  expect(getByText('SL')).toBeTruthy();
});

it('apre il menu e invoca le azioni', () => {
  const onOpenSettings = jest.fn();
  const { getByLabelText, getByText } = wrap(
    <AvatarMenu email="a@b.com" onOpenSettings={onOpenSettings} onSignOut={() => {}} />,
  );
  fireEvent.press(getByLabelText('Apri il menu account'));
  fireEvent.press(getByText('Impostazioni'));
  expect(onOpenSettings).toHaveBeenCalled();
});
