import * as React from 'react';

export interface AddButtonProps {
  onClick?: () => void;
  /** Extended FAB label, e.g. "Add". Omit for the icon-only circle. */
  label?: string;
  style?: React.CSSProperties;
}

/** The prominent "+" capture FAB. */
export function AddButton(props: AddButtonProps): JSX.Element;
