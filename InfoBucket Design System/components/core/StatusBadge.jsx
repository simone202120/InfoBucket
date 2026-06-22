import React from 'react';

const MAP = {
  processing: { label: 'Processing', fg: 'var(--status-processing)', bg: 'var(--status-processing-soft)', pulse: true },
  ready:      { label: 'Ready',      fg: 'var(--status-ready)',      bg: 'var(--status-ready-soft)' },
  saved:      { label: 'Saved',      fg: 'var(--status-saved)',      bg: 'var(--status-saved-soft)' },
  archived:   { label: 'Archived',   fg: 'var(--status-archived)',   bg: 'var(--status-archived-soft)' },
  expiring:   { label: 'Expiring',   fg: 'var(--status-expiring)',   bg: 'var(--status-expiring-soft)' },
};

/**
 * StatusBadge — the second structural signal: where an item is in its life.
 * Pill with a state dot; processing gently pulses. Pass children to override
 * the label (e.g. a countdown for expiring).
 */
export function StatusBadge({ status = 'ready', children, dot = true, style }) {
  const m = MAP[status] || MAP.ready;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px 4px 8px',
        borderRadius: 'var(--r-pill)',
        background: m.bg,
        color: m.fg,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-micro)',
        letterSpacing: 'var(--t-micro-tracking)',
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: m.fg,
            flex: 'none',
            animation: m.pulse ? 'ib-pulse 1.4s ease-in-out infinite' : 'none',
          }}
        />
      ) : null}
      {children || m.label}
      <style>{`@keyframes ib-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @media (prefers-reduced-motion: reduce){[style*="ib-pulse"]{animation:none!important}}`}</style>
    </span>
  );
}
