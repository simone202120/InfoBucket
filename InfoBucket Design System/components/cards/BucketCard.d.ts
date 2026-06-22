import * as React from 'react';

export type SourceKind = 'article' | 'video' | 'reel' | 'document' | 'note';

/**
 * A Library collection card.
 * @startingPoint section="Cards" subtitle="BucketCard — a Library collection" viewport="700x560"
 */
export interface BucketCardProps {
  name: string;
  /** Item count shown in catalog mono. */
  count?: number;
  /** One-line description (also the hint the AI uses to route items). */
  description?: string;
  /** Source kinds inside — drawn as a small spine of hued ticks. */
  sources?: SourceKind[];
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * A Library collection: name, count, description and a provenance spine.
 *
 * @startingPoint section="Cards" subtitle="BucketCard — a Library collection" viewport="360x180"
 */
export function BucketCard(props: BucketCardProps): JSX.Element;
