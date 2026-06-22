import * as React from 'react';

export interface SearchFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: React.CSSProperties;
}

/** Free-text query well with leading magnifier and clear control. */
export function SearchField(props: SearchFieldProps): JSX.Element;
