import * as React from 'react';

export interface ErrorBannerProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}

/** Inline error stated as direction with a single retry. */
export function ErrorBanner(props: ErrorBannerProps): JSX.Element;
