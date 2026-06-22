import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ErrorBanner } from '../ErrorBanner';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('ErrorBanner', () => {
  it('mostra il messaggio e chiama onAction dal retry', () => {
    const onAction = jest.fn();
    const { getByText, getByLabelText } = renderInTheme(
      <ErrorBanner message="Couldn't reach that link." onAction={onAction} />,
    );
    expect(getByText("Couldn't reach that link.")).toBeTruthy();
    fireEvent.press(getByLabelText('Try again'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('chiama onDismiss dalla ×', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = renderInTheme(<ErrorBanner onDismiss={onDismiss} />);
    fireEvent.press(getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
