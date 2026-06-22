import React from 'react';
import { SparkleIcon, CheckIcon, PlusIcon } from './icons.jsx';

/**
 * BucketChip — the AI-proposed destination with accept-on-the-fly. A sparkle
 * marks it as a suggestion; the trailing control accepts (✓) in one tap, or
 * creates (+) when the proposal is a brand-new bucket. `confirmed` shows the
 * settled, user-confirmed state (no sparkle, solid).
 */
export function BucketChip({
  name,
  isNew = false,
  confirmed = false,
  onAccept,
  onClick,
  style,
}) {
  const accent = confirmed ? 'var(--primary)' : 'var(--text-primary)';
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 5px 5px 12px',
        borderRadius: 'var(--r-pill)',
        background: confirmed ? 'var(--primary-soft)' : 'var(--surface)',
        border: `1.5px solid ${confirmed ? 'var(--primary-soft-2)' : 'var(--border-strong)'}`,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {!confirmed && (
        <SparkleIcon size={14} style={{ color: 'var(--primary)', flex: 'none' }} />
      )}
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--t-body-sm)',
          fontWeight: 600,
          color: accent,
          whiteSpace: 'nowrap',
        }}
      >
        {isNew && !confirmed ? `New · ${name}` : name}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAccept && onAccept(); }}
        aria-label={isNew ? `Create ${name}` : `Accept ${name}`}
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: 26,
          height: 26,
          border: 0,
          borderRadius: '50%',
          flex: 'none',
          cursor: 'pointer',
          color: confirmed ? 'var(--primary)' : 'var(--text-on-primary)',
          background: confirmed ? 'transparent' : 'var(--primary)',
        }}
      >
        {confirmed ? <CheckIcon size={15} /> : isNew ? <PlusIcon size={15} /> : <CheckIcon size={15} />}
      </button>
    </span>
  );
}
