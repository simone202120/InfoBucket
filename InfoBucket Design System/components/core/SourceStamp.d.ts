import * as React from 'react';

export type SourceKind = 'article' | 'video' | 'reel' | 'document' | 'note';

/**
 * The provenance signature mark.
 * @startingPoint section="Core" subtitle="SourceStamp — the provenance signature" viewport="700x430"
 */
export interface SourceStampProps {
  /** Origin of the captured item. @default "article" */
  source?: SourceKind;
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Show the catalog-mono source label beside the stamp. */
  showLabel?: boolean;
  /** Override label text, e.g. a publication name. */
  label?: string;
  style?: React.CSSProperties;
}

/**
 * The signature provenance mark — a tinted glyph square in each source's hue.
 * Every item, search result and saved entry leads with one.
 *
 * @startingPoint section="Core" subtitle="SourceStamp — the provenance signature" viewport="700x140"
 */
export function SourceStamp(props: SourceStampProps): JSX.Element;
