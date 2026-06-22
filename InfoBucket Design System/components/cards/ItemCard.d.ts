import * as React from 'react';

export type SourceKind = 'article' | 'video' | 'reel' | 'document' | 'note';
export type ItemStatus = 'processing' | 'ready' | 'expiring' | 'saved' | 'archived';

/**
 * The Inbox hero card.
 * @startingPoint section="Cards" subtitle="ItemCard — the Inbox hero, all states" viewport="700x560"
 */
export interface ItemCardProps {
  source?: SourceKind;
  /** Publication / channel / handle shown after the source label. */
  sourceName?: string;
  title?: string;
  /** The summary — rendered in Newsreader as the most legible thing on screen. */
  summary?: string;
  tags?: string[];
  /** @default "ready" */
  status?: ItemStatus;
  /** AI bucket proposal for accept-on-the-fly. */
  proposedBucket?: { name: string; isNew?: boolean };
  /** Days until archive — shown as a quiet amber countdown when expiring. */
  daysLeft?: number;
  onAccept?: () => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * The hero card of Inbox: provenance + lifecycle + a Newsreader summary, with
 * processing (skeleton), ready (bucket proposal) and expiring (amber decay)
 * states.
 *
 * @startingPoint section="Cards" subtitle="ItemCard — the Inbox hero, all states" viewport="380x260"
 */
export function ItemCard(props: ItemCardProps): JSX.Element;
