import * as React from 'react';

export type ItemStatus = 'processing' | 'ready' | 'saved' | 'archived' | 'expiring';

export interface StatusBadgeProps {
  /** Lifecycle state of the item. @default "ready" */
  status?: ItemStatus;
  /** Override label — e.g. "In 3 days" for an expiring item. */
  children?: React.ReactNode;
  /** Show the leading state dot. @default true */
  dot?: boolean;
  style?: React.CSSProperties;
}

/**
 * Lifecycle signal pill (processing · ready · saved · archived · expiring).
 * Processing pulses gently; honours prefers-reduced-motion.
 *
 * @startingPoint section="Core" subtitle="StatusBadge — lifecycle signal" viewport="700x120"
 */
export function StatusBadge(props: StatusBadgeProps): JSX.Element;
