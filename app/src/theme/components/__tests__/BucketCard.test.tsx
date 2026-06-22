import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { BucketCard } from '../BucketCard';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('BucketCard', () => {
  it('mostra nome, conteggio e descrizione', () => {
    const { getByText } = renderInTheme(
      <BucketCard
        name="Machine learning"
        count={24}
        description="Paper e spiegoni che voglio davvero finire."
        sources={['article', 'document', 'youtube']}
      />,
    );
    expect(getByText('Machine learning')).toBeTruthy();
    expect(getByText('24 elementi')).toBeTruthy();
    expect(getByText('Paper e spiegoni che voglio davvero finire.')).toBeTruthy();
  });

  it('usa il singolare per un solo elemento', () => {
    const { getByText } = renderInTheme(<BucketCard name="Note" count={1} />);
    expect(getByText('1 elemento')).toBeTruthy();
  });

  it('chiama onPress al tocco', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderInTheme(
      <BucketCard name="Ricette" count={3} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Ricette'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
