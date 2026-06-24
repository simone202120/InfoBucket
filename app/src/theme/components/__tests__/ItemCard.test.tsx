import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ItemCard } from '../ItemCard';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

const SUMMARY = 'The single claim worth keeping, surfaced first.';

describe('ItemCard', () => {
  it('mostra il summary nello stato ready', () => {
    const { getByText } = renderInTheme(
      <ItemCard source="article" status="ready" summary={SUMMARY} />,
    );
    expect(getByText(SUMMARY)).toBeTruthy();
  });

  it('mostra lo skeleton (niente summary) nello stato processing', () => {
    const { queryByText, getByLabelText } = renderInTheme(
      <ItemCard source="youtube" status="processing" summary={SUMMARY} />,
    );
    expect(queryByText(SUMMARY)).toBeNull();
    expect(getByLabelText('Loading')).toBeTruthy();
    expect(queryByText('Riassumo · propongo un bucket…')).toBeTruthy();
  });

  it('nello stato ready mostra la proposta di bucket e accetta al volo', () => {
    const onAccept = jest.fn();
    const { getByText, getByLabelText } = renderInTheme(
      <ItemCard
        source="article"
        status="ready"
        summary={SUMMARY}
        proposedBucket={{ name: 'Machine learning' }}
        tags={['ml', 'to-read']}
        onAccept={onAccept}
      />,
    );
    expect(getByText('Machine learning')).toBeTruthy();
    expect(getByText('ml')).toBeTruthy();
    fireEvent.press(getByLabelText('Accept Machine learning'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('nello stato expiring mostra il countdown nel badge una sola volta', () => {
    const { getAllByText } = renderInTheme(
      <ItemCard source="reel" status="expiring" summary={SUMMARY} daysLeft={3} />,
    );
    expect(getAllByText('Tra 3 giorni').length).toBe(1);
  });

  it('chiama onPress quando il card è premuto', () => {
    const onPress = jest.fn();
    const { getByRole } = renderInTheme(
      <ItemCard source="article" status="ready" summary={SUMMARY} onPress={onPress} />,
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('mostra la barra di provenienza nel colore della fonte', () => {
    const { getByTestId } = renderInTheme(<ItemCard source="youtube" summary={SUMMARY} onPress={() => {}} />);
    // La rail è nascosta all'accessibilità (decorativa): includila esplicitamente.
    const rail = getByTestId('provenance-rail', { includeHiddenElements: true });
    const style = Array.isArray(rail.props.style) ? Object.assign({}, ...rail.props.style) : rail.props.style;
    expect(style.backgroundColor).toBeDefined();
  });
});
