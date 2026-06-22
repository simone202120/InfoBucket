import * as React from 'react';

/**
 * Props for the primary action control.
 * @startingPoint section="Core" subtitle="Buttons — primary, secondary, ghost, destructive" viewport="700x430"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual weight. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Stretch to container width (full-width primary CTAs on mobile). */
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Primary action control for InfoBucket. Label matches the action name used
 * across the whole flow (Save, Regenerate, Delete).
 *
 * @startingPoint section="Core" subtitle="Buttons — primary, secondary, ghost, destructive" viewport="700x150"
 */
export function Button(props: ButtonProps): JSX.Element;
