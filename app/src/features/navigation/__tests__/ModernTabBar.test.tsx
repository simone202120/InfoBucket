import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ThemeProvider } from '@/theme';
import { ModernTabBar } from '../ModernTabBar';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

interface FakePropsOptions {
  focusedIndex?: number;
  emitPreventsDefault?: boolean;
}

const ROUTES = [
  { key: 'index', name: 'index', title: 'Inbox' },
  { key: 'library', name: 'library', title: 'Libreria' },
  { key: 'search', name: 'search', title: 'Cerca' },
] as const;

/**
 * Costruisce un BottomTabBarProps minimale ma realistico. Lo shape completo del
 * navigator è enorme e non serve al componente: castiamo una sola volta il mock,
 * isolando qui l'unico punto non tipato del test.
 */
function makeProps({ focusedIndex = 0, emitPreventsDefault = false }: FakePropsOptions = {}) {
  const navigate = jest.fn();
  const emit = jest.fn(() => ({ defaultPrevented: emitPreventsDefault }));

  const descriptors = Object.fromEntries(
    ROUTES.map((r) => [r.key, { options: { title: r.title, tabBarIcon: () => null } }]),
  );

  const props = {
    state: {
      index: focusedIndex,
      routes: ROUTES.map((r) => ({ key: r.key, name: r.name })),
    },
    descriptors,
    navigation: { emit, navigate },
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as unknown as BottomTabBarProps;

  return { props, navigate, emit };
}

describe('ModernTabBar', () => {
  it('mostra l\'etichetta solo della tab attiva', () => {
    const { props } = makeProps({ focusedIndex: 0 });
    const { getByText, queryByText } = renderInTheme(<ModernTabBar {...props} />);

    expect(getByText('Inbox')).toBeTruthy();
    expect(queryByText('Libreria')).toBeNull();
    expect(queryByText('Cerca')).toBeNull();
  });

  it('naviga alla tab toccata se non è già attiva', () => {
    const { props, navigate } = makeProps({ focusedIndex: 0 });
    const { getByLabelText } = renderInTheme(<ModernTabBar {...props} />);

    fireEvent.press(getByLabelText('Cerca'));

    expect(navigate).toHaveBeenCalledWith('search', undefined);
  });

  it('non naviga toccando la tab già attiva', () => {
    const { props, navigate } = makeProps({ focusedIndex: 0 });
    const { getByLabelText } = renderInTheme(<ModernTabBar {...props} />);

    fireEvent.press(getByLabelText('Inbox'));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('rispetta il preventDefault dell\'evento tabPress', () => {
    const { props, navigate } = makeProps({ focusedIndex: 0, emitPreventsDefault: true });
    const { getByLabelText } = renderInTheme(<ModernTabBar {...props} />);

    fireEvent.press(getByLabelText('Cerca'));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('espone lo stato selected per l\'accessibilità', () => {
    const { props } = makeProps({ focusedIndex: 2 });
    const { getByLabelText } = renderInTheme(<ModernTabBar {...props} />);

    expect(getByLabelText('Cerca').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Inbox').props.accessibilityState.selected).toBe(false);
  });
});
