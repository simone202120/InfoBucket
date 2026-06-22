import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { StatusBadge, type BadgeStatus } from '../StatusBadge';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

const STATUSES: { status: BadgeStatus; label: string }[] = [
  { status: 'processing', label: 'Processing' },
  { status: 'ready', label: 'Ready' },
  { status: 'saved', label: 'Saved' },
  { status: 'archived', label: 'Archived' },
  { status: 'expiring', label: 'Expiring' },
];

describe('StatusBadge', () => {
  it.each(STATUSES)('rende l\'etichetta di default per $status', ({ status, label }) => {
    const { getByText } = renderInTheme(<StatusBadge status={status} />);
    expect(getByText(label)).toBeTruthy();
  });

  it('sovrascrive l\'etichetta con children (countdown)', () => {
    const { getByText, queryByText } = renderInTheme(<StatusBadge status="expiring">In 3 days</StatusBadge>);
    expect(getByText('In 3 days')).toBeTruthy();
    expect(queryByText('Expiring')).toBeNull();
  });
});
