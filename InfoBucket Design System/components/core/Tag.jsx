import React from 'react';
import { XIcon } from './icons.jsx';

/**
 * Tag — a keyword chip. Quiet by default (catalog mono on a soft fill).
 * `removable` shows an × for editing; `onAdd` style is handled by the consumer.
 */
export function Tag({ children, removable = false, onRemove, selected = false, onClick, style }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: removable ? '5px 6px 5px 11px' : '5px 11px',
        borderRadius: 'var(--r-pill)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-label)',
        letterSpacing: '0.01em',
        lineHeight: 1,
        cursor: onClick ? 'pointer' : 'default',
        color: selected ? 'var(--primary)' : 'var(--text-secondary)',
        background: selected ? 'var(--primary-soft)' : 'var(--bg-sunken)',
        border: `1px solid ${selected ? 'var(--primary-soft-2)' : 'transparent'}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span style={{ opacity: 0.55 }}>#</span>
      {children}
      {removable ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove && onRemove(); }}
          aria-label="Remove tag"
          style={{
            display: 'inline-grid', placeItems: 'center', width: 18, height: 18,
            marginLeft: 1, border: 0, borderRadius: '50%', cursor: 'pointer',
            color: 'var(--text-tertiary)', background: 'transparent',
          }}
        >
          <XIcon size={12} />
        </button>
      ) : null}
    </span>
  );
}
