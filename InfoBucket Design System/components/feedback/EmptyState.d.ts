import * as React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

/**
 * Empty/zero states written as direction — what to do next, never just mood.
 *
 * @startingPoint section="Feedback" subtitle="EmptyState + ErrorBanner" viewport="700x320"
 */
export function EmptyState(props: EmptyStateProps): JSX.Element;
