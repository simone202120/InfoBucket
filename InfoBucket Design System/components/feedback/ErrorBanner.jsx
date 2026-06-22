import React from 'react';
import { AlertIcon, XIcon } from '../core/icons.jsx';

/**
 * ErrorBanner — direction, not mood. States plainly what failed and what to do,
 * with a single retry. Soft danger fill, never a full-bleed alarm.
 */
export function ErrorBanner({ message = "Couldn't reach that link.", actionLabel = 'Try again', onAction, onDismiss, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 11,
      background: 'var(--danger-soft)', borderRadius: 'var(--r-md)',
      padding: '12px 12px 12px 14px', ...style,
    }}>
      <AlertIcon size={19} style={{ color: 'var(--danger)', flex: 'none' }} />
      <span style={{
        flex: 1, fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body)',
        color: 'var(--text-primary)', lineHeight: 1.35,
      }}>{message}</span>
      {actionLabel ? (
        <button type="button" onClick={onAction} style={{
          flex: 'none', border: 0, background: 'transparent', cursor: 'pointer',
          fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--danger)',
          padding: '6px 8px', borderRadius: 'var(--r-xs)',
        }}>{actionLabel}</button>
      ) : null}
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" style={{
          flex: 'none', display: 'grid', placeItems: 'center', width: 28, height: 28,
          border: 0, borderRadius: '50%', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
        }}><XIcon size={14} /></button>
      ) : null}
    </div>
  );
}
