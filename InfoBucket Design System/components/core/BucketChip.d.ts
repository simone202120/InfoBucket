import * as React from 'react';

/**
 * AI bucket proposal with accept-on-the-fly.
 * @startingPoint section="Core" subtitle="BucketChip — AI proposal, accept on the fly" viewport="700x430"
 */
export interface BucketChipProps {
  /** Proposed bucket name. */
  name: string;
  /** The AI proposes creating a NEW bucket (shows a + and "New ·" prefix). */
  isNew?: boolean;
  /** User-confirmed, settled state (no sparkle, primary fill). */
  confirmed?: boolean;
  /** Accept the proposal / create the bucket in one tap. */
  onAccept?: () => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * AI bucket proposal with accept-on-the-fly — the core triage gesture. Sparkle
 * = suggestion; trailing control is ✓ (accept) or + (create new).
 *
 * @startingPoint section="Core" subtitle="BucketChip — AI proposal, accept on the fly" viewport="700x120"
 */
export function BucketChip(props: BucketChipProps): JSX.Element;
