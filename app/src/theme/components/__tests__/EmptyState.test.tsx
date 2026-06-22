import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { EmptyState } from '../EmptyState';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('EmptyState', () => {
  it('mostra titolo e corpo', () => {
    const { getByText } = renderInTheme(
      <EmptyState title="All sorted" body="Nothing waiting in your inbox." />,
    );
    expect(getByText('All sorted')).toBeTruthy();
    expect(getByText('Nothing waiting in your inbox.')).toBeTruthy();
  });

  it('rende l\'azione e chiama onAction', () => {
    const onAction = jest.fn();
    const { getByText } = renderInTheme(
      <EmptyState title="Empty" actionLabel="Add a link" onAction={onAction} />,
    );
    fireEvent.press(getByText('Add a link'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
