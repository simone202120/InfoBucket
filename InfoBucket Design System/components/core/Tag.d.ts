import * as React from 'react';

export interface TagProps {
  children?: React.ReactNode;
  /** Show a remove (×) affordance for editing. */
  removable?: boolean;
  onRemove?: () => void;
  /** Selected/active filter state. */
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Keyword chip in catalog mono. Quiet by default; `selected` for active
 * filters, `removable` for the review editor.
 */
export function Tag(props: TagProps): JSX.Element;
