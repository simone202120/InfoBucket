import React from 'react';
import { SearchIcon, XIcon } from '../core/icons.jsx';

/**
 * SearchField — the free-text query well. Sunken surface, rounded, with a
 * leading magnifier and a clear (×) when filled. Used on Search and inside
 * bucket detail.
 */
export function SearchField({ value, onChange, onClear, placeholder = 'Search everything', autoFocus, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)',
      padding: '0 12px', minHeight: 'var(--touch-min)',
      border: '1px solid transparent', ...style,
    }}>
      <SearchIcon size={18} style={{ color: 'var(--text-tertiary)', flex: 'none' }} />
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body)', color: 'var(--text-primary)',
          padding: '11px 0',
        }}
      />
      {value ? (
        <button type="button" onClick={onClear} aria-label="Clear"
          style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, border: 0,
            borderRadius: '50%', cursor: 'pointer', color: 'var(--text-secondary)', background: 'var(--mist)' }}>
          <XIcon size={13} />
        </button>
      ) : null}
    </div>
  );
}
