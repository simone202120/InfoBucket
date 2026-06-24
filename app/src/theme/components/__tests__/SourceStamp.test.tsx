import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import type { SourceType } from '@/types/domain';
import { SourceStamp } from '../SourceStamp';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

const SOURCES: SourceType[] = ['article', 'youtube', 'reel', 'tiktok', 'document', 'other'];

describe('SourceStamp', () => {
  it.each(SOURCES)('rende per la fonte %s', (source) => {
    const { toJSON } = renderInTheme(<SourceStamp source={source} />);
    expect(toJSON()).not.toBeNull();
  });

  it('mostra l\'etichetta di default quando showLabel', () => {
    const { getByText } = renderInTheme(<SourceStamp source="article" showLabel />);
    expect(getByText('Article')).toBeTruthy();
  });

  it('usa l\'etichetta libera quando fornita', () => {
    const { getByText } = renderInTheme(<SourceStamp source="article" showLabel label="The Atlantic" />);
    expect(getByText('The Atlantic')).toBeTruthy();
  });

  it('mostra la favicon del dominio per un articolo con host', () => {
    const { getByTestId } = renderInTheme(<SourceStamp source="article" host="theatlantic.com" />);
    expect(getByTestId('favicon-image')).toBeTruthy();
  });

  it('per un articolo senza host usa il glifo di fallback (niente favicon)', () => {
    const { queryByTestId } = renderInTheme(<SourceStamp source="article" host={null} />);
    expect(queryByTestId('favicon-image')).toBeNull();
  });

  it('per YouTube mostra il logo brand, non una favicon', () => {
    const { queryByTestId, toJSON } = renderInTheme(<SourceStamp source="youtube" />);
    expect(queryByTestId('favicon-image')).toBeNull();
    expect(toJSON()).not.toBeNull();
  });
});
