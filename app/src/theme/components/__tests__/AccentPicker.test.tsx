import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { AccentPicker } from '../AccentPicker';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('chiama onChange con un esadecimale valido', () => {
  const onChange = jest.fn();
  const { getByLabelText } = wrap(<AccentPicker value="#2D5AD9" onChange={onChange} />);
  fireEvent.changeText(getByLabelText('Colore esadecimale'), '#10A37F');
  expect(onChange).toHaveBeenCalledWith('#10A37F');
});

it('ignora un valore non valido', () => {
  const onChange = jest.fn();
  const { getByLabelText } = wrap(<AccentPicker value="#2D5AD9" onChange={onChange} />);
  fireEvent.changeText(getByLabelText('Colore esadecimale'), 'ziogio');
  expect(onChange).not.toHaveBeenCalled();
});
