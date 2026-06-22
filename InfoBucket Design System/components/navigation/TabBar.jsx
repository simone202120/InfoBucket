import React from 'react';
import { InboxIcon, LibraryIcon, SearchIcon } from '../core/icons.jsx';

const ICONS = { inbox: InboxIcon, library: LibraryIcon, search: SearchIcon };

const DEFAULT_TABS = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'library', label: 'Library' },
  { key: 'search', label: 'Search' },
];

/**
 * TabBar — modern floating bottom navigation (Inbox · Library · Search).
 * The bar detaches from the bottom edge as a rounded, shadowed pill; the active
 * tab expands into a primary-soft pill showing its label, while inactive tabs
 * stay as quiet icons. Each target meets the 44pt minimum; safe-area inset is
 * applied below the floating bar.
 */
export function TabBar({ active = 'inbox', tabs = DEFAULT_TABS, onChange, badge = {}, style }) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-pill)',
        padding: 6,
        margin: '0 16px',
        marginBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        boxShadow: 'var(--shadow-lg)',
        ...style,
      }}
    >
      {tabs.map((t) => {
        const Icon = ICONS[t.key] || InboxIcon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange && onChange(t.key)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: isActive ? '1 1 auto' : '0 0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 'var(--touch-min)', padding: isActive ? '0 18px' : '0 13px',
              border: 0, cursor: 'pointer',
              borderRadius: 'var(--r-pill)',
              background: isActive ? 'var(--primary-soft)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-tertiary)',
              transition: 'background .22s ease, color .18s ease, flex .26s ease, padding .26s ease',
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex', flex: '0 0 auto' }}>
              <Icon size={22} />
              {badge[t.key] ? (
                <span style={{
                  position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 'var(--r-pill)', background: 'var(--primary)', color: 'var(--text-on-primary)',
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  display: 'grid', placeItems: 'center', boxSizing: 'border-box',
                  border: '1.5px solid var(--surface-raised)',
                }}>{badge[t.key]}</span>
              ) : null}
            </span>
            <span style={{
              fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden',
              maxWidth: isActive ? 90 : 0, opacity: isActive ? 1 : 0,
              transition: 'max-width .26s ease, opacity .2s ease',
            }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
