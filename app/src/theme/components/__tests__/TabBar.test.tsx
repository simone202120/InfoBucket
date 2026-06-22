import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { InboxIcon, LibraryIcon, SearchIcon } from '@/theme/icons';
import { TabBar, type TabBarItem } from '../TabBar';

const ITEMS: readonly TabBarItem[] = [
  { key: 'index', label: 'Inbox', Icon: InboxIcon },
  { key: 'library', label: 'Libreria', Icon: LibraryIcon },
  { key: 'search', label: 'Cerca', Icon: SearchIcon },
];

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('TabBar', () => {
  it('mostra la label solo della tab attiva (le inattive restano icone)', () => {
    const { getByText, queryByText } = renderInTheme(
      <TabBar items={ITEMS} activeKey="library" onChange={jest.fn()} />,
    );
    expect(getByText('Libreria')).toBeTruthy();
    expect(queryByText('Inbox')).toBeNull();
    expect(queryByText('Cerca')).toBeNull();
  });

  it('espone ogni tab come bottone accessibile, marcando quella attiva', () => {
    const { getByLabelText } = renderInTheme(
      <TabBar items={ITEMS} activeKey="index" onChange={jest.fn()} />,
    );
    expect(getByLabelText('Inbox').props.accessibilityState).toEqual({ selected: true });
    expect(getByLabelText('Cerca').props.accessibilityState).toEqual({ selected: false });
  });

  it('chiama onChange con la key della tab premuta', () => {
    const onChange = jest.fn();
    const { getByLabelText } = renderInTheme(
      <TabBar items={ITEMS} activeKey="index" onChange={onChange} />,
    );
    fireEvent.press(getByLabelText('Cerca'));
    expect(onChange).toHaveBeenCalledWith('search');
  });

  it('mostra il badge con il contatore della tab', () => {
    const { getByText } = renderInTheme(
      <TabBar items={ITEMS} activeKey="index" onChange={jest.fn()} badge={{ index: 3 }} />,
    );
    expect(getByText('3')).toBeTruthy();
  });
});
