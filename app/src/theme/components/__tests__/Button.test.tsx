import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { Button } from '../Button';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('Button', () => {
  it('chiama onPress al tap', () => {
    const onPress = jest.fn();
    const { getByText } = renderInTheme(<Button onPress={onPress}>Save</Button>);
    fireEvent.press(getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('non chiama onPress quando disabled', () => {
    const onPress = jest.fn();
    const { getByText } = renderInTheme(
      <Button onPress={onPress} disabled>
        Save
      </Button>,
    );
    fireEvent.press(getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('espone lo stato disabled per l\'accessibilità', () => {
    const { getByRole } = renderInTheme(
      <Button disabled accessibilityLabel="Save">
        Save
      </Button>,
    );
    expect(getByRole('button').props.accessibilityState.disabled).toBe(true);
  });
});
