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
});
