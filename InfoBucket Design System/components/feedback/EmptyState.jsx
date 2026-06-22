import React from 'react';
import { Button } from '../core/Button.jsx';

/**
 * EmptyState — empty as direction, not mood. A quiet glyph, a plain headline in
 * Bricolage, one line of what-to-do in Newsreader, and at most one action.
 * Pass `icon` (a node) to match the context (inbox all-sorted, empty search…).
 */
export function EmptyState({ icon, title, body, actionLabel, onAction, style }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '40px 28px', maxWidth: 320, margin: '0 auto', ...style,
    }}>
      {icon ? (
        <div style={{
          display: 'grid', placeItems: 'center', width: 64, height: 64, marginBottom: 18,
          borderRadius: 'var(--r-lg)', background: 'var(--primary-soft)', color: 'var(--primary)',
        }}>{icon}</div>
      ) : null}
      {title ? (
        <h2 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--t-title)',
          lineHeight: 'var(--t-title-lh)', fontWeight: 700, color: 'var(--text-primary)',
        }}>{title}</h2>
      ) : null}
      {body ? (
        <p style={{
          margin: '8px 0 0', fontFamily: 'var(--font-read)', fontSize: 'var(--t-read)',
          lineHeight: 'var(--t-read-lh)', color: 'var(--text-secondary)',
        }}>{body}</p>
      ) : null}
      {actionLabel ? (
        <div style={{ marginTop: 22 }}>
          <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
