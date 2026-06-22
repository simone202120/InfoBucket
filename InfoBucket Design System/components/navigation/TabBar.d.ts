import * as React from 'react';

export interface TabItem { key: 'inbox' | 'library' | 'search'; label: string; }

export interface TabBarProps {
  /** @default "inbox" */
  active?: 'inbox' | 'library' | 'search';
  tabs?: TabItem[];
  onChange?: (key: string) => void;
  /** Optional count badge per tab, e.g. { inbox: 3 }. */
  badge?: Record<string, number | string>;
  style?: React.CSSProperties;
}

/**
 * Bottom navigation: Inbox · Library · Search.
 *
 * @startingPoint section="Navigation" subtitle="TabBar + AddButton (FAB)" viewport="390x150"
 */
export function TabBar(props: TabBarProps): JSX.Element;
