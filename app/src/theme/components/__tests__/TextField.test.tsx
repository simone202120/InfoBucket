import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { TextField } from '../TextField';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('TextField', () => {
  it('rende l\'etichetta e propaga il testo', () => {
    const onChangeText = jest.fn();
    const { getByLabelText, getByText } = renderInTheme(
      <TextField label="Bucket name" value="" onChangeText={onChangeText} />,
    );
    expect(getByText('Bucket name')).toBeTruthy();
    fireEvent.changeText(getByLabelText('Bucket name'), 'Robotics');
    expect(onChangeText).toHaveBeenCalledWith('Robotics');
  });

  it('mostra l\'errore al posto dell\'hint', () => {
    const { getByText, queryByText } = renderInTheme(
      <TextField label="URL" hint="Paste a link" error="Invalid URL" />,
    );
    expect(getByText('Invalid URL')).toBeTruthy();
    expect(queryByText('Paste a link')).toBeNull();
  });
});
