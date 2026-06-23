import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { AddButton } from '../AddButton';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('AddButton', () => {
  it('chiama onPress al tap (variante icona)', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderInTheme(<AddButton onPress={onPress} />);
    fireEvent.press(getByLabelText('Aggiungi'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('mostra l\'etichetta nella variante estesa', () => {
    const { getByText, getByLabelText } = renderInTheme(<AddButton label="Add a link" onPress={jest.fn()} />);
    expect(getByText('Add a link')).toBeTruthy();
    expect(getByLabelText('Add a link')).toBeTruthy();
  });
});
