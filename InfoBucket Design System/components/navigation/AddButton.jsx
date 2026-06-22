import React from 'react';
import { PlusIcon } from '../core/icons.jsx';

/**
 * AddButton — the prominent "+" for manual capture. A raised circular FAB in
 * the primary color; floats above the tab bar bottom-right. Label optional for
 * an extended variant.
 */
export function AddButton({ onClick, label, style }) {
  const extended = Boolean(label);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || 'Add'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 56, width: extended ? 'auto' : 56, padding: extended ? '0 22px 0 18px' : 0,
        borderRadius: 'var(--r-pill)', border: 0, cursor: 'pointer',
        background: 'var(--primary)', color: 'var(--text-on-primary)',
        boxShadow: 'var(--shadow-fab)',
        ...style,
      }}
    >
      <PlusIcon size={24} />
      {extended ? (
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--t-subheading)', fontWeight: 600 }}>{label}</span>
      ) : null}
    </button>
  );
}
