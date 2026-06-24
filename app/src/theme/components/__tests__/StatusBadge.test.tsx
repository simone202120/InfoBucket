import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { StatusBadge, type BadgeStatus } from '../StatusBadge';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

const STATUSES: { status: BadgeStatus; label: string }[] = [
  { status: 'processing', label: 'In lavorazione' },
  { status: 'ready', label: 'Pronto' },
  { status: 'saved', label: 'Salvato' },
  { status: 'archived', label: 'Archiviato' },
  { status: 'expiring', label: 'In scadenza' },
];

describe('StatusBadge', () => {
  it.each(STATUSES)('rende l\'etichetta di default per $status', ({ status, label }) => {
    const { getByText } = renderInTheme(<StatusBadge status={status} />);
    expect(getByText(label)).toBeTruthy();
  });

  it('sovrascrive l\'etichetta con children (countdown)', () => {
    const { getByText, queryByText } = renderInTheme(<StatusBadge status="expiring">Tra 3 giorni</StatusBadge>);
    expect(getByText('Tra 3 giorni')).toBeTruthy();
    expect(queryByText('In scadenza')).toBeNull();
  });
});
