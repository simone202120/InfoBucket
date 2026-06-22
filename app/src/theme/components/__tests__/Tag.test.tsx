import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { Tag } from '../Tag';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('Tag', () => {
  it('rende il testo del tag', () => {
    const { getByText } = renderInTheme(<Tag>machine-learning</Tag>);
    expect(getByText('machine-learning')).toBeTruthy();
  });

  it('chiama onRemove dal pulsante × quando removable', () => {
    const onRemove = jest.fn();
    const { getByLabelText } = renderInTheme(
      <Tag removable onRemove={onRemove}>
        ml
      </Tag>,
    );
    fireEvent.press(getByLabelText('Remove tag'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('chiama onPress quando interattivo', () => {
    const onPress = jest.fn();
    const { getByText } = renderInTheme(
      <Tag onPress={onPress}>ml</Tag>,
    );
    fireEvent.press(getByText('ml'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
