import React from 'react';
import { SOURCE_ICON } from './icons.jsx';

const SOURCE_LABEL = {
  article: 'Article',
  video: 'Video',
  reel: 'Reel',
  document: 'Document',
  note: 'Note',
};

const sizes = {
  sm: { box: 28, icon: 15, radius: 'var(--r-sm)' },
  md: { box: 38, icon: 20, radius: 'var(--r-md)' },
  lg: { box: 48, icon: 25, radius: 'var(--r-md)' },
};

/**
 * SourceStamp — the signature provenance mark. A tinted square in the source's
 * own hue holding its glyph; every captured item leads with one. Optionally
 * shows the source name (and free text like a publication) in catalog mono.
 */
export function SourceStamp({ source = 'article', size = 'md', showLabel = false, label, style }) {
  const s = sizes[size] || sizes.md;
  const Icon = SOURCE_ICON[source] || SOURCE_ICON.article;
  const stamp = (
    <span
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: s.box,
        height: s.box,
        flex: 'none',
        borderRadius: s.radius,
        color: `var(--src-${source})`,
        background: `var(--src-${source}-soft)`,
      }}
    >
      <Icon size={s.icon} />
    </span>
  );
  if (!showLabel) return React.cloneElement(stamp, { style: { ...stamp.props.style, ...style } });
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}>
      {stamp}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--t-meta)',
          letterSpacing: 'var(--t-meta-tracking)',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}
      >
        {label || SOURCE_LABEL[source]}
      </span>
    </span>
  );
}
