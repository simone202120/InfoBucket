import React from 'react';
import { ChevronRightIcon } from '../core/icons.jsx';

/**
 * BucketCard — a collection in the Library. Name in Bricolage, an item count in
 * catalog mono, a one-line description, and a small spine of source-hue ticks
 * hinting at what's inside (provenance, again). Works in a grid or a list.
 */
export function BucketCard({
  name,
  count = 0,
  description,
  sources = [],
  onClick,
  style,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        textAlign: 'left',
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 16,
        cursor: 'pointer',
        ...style,
      }}
    >
      {/* spine of source ticks */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {(sources.length ? sources : ['note']).slice(0, 6).map((s, i) => (
          <span key={i} style={{ width: 22, height: 5, borderRadius: 3, background: `var(--src-${s})` }} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <h3 style={{
          margin: 0, fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-heading)', lineHeight: 'var(--t-heading-lh)',
          fontWeight: 700, color: 'var(--text-primary)',
        }}>{name}</h3>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 'var(--t-label)',
          color: 'var(--text-tertiary)', flex: 'none',
        }}>{count}</span>
      </div>

      {description ? (
        <p style={{
          margin: '6px 0 0', fontFamily: 'var(--font-read)',
          fontSize: 'var(--t-read-sm)', lineHeight: 'var(--t-read-sm-lh)',
          color: 'var(--text-secondary)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{description}</p>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, color: 'var(--primary)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-micro)', letterSpacing: 'var(--t-micro-tracking)', textTransform: 'uppercase' }}>Open</span>
        <ChevronRightIcon size={13} />
      </div>
    </button>
  );
}
