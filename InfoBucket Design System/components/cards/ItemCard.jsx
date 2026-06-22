import React from 'react';
import { SourceStamp } from '../core/SourceStamp.jsx';
import { StatusBadge } from '../core/StatusBadge.jsx';
import { BucketChip } from '../core/BucketChip.jsx';
import { Tag } from '../core/Tag.jsx';
import { ClockIcon } from '../core/icons.jsx';

const SOURCE_LABEL = { article: 'Article', video: 'Video', reel: 'Reel', document: 'Document', note: 'Note' };

/**
 * ItemCard — the hero of Inbox. Leads with the source stamp (provenance) and
 * the lifecycle status, and makes the Newsreader summary the most readable
 * thing on screen. Handles three live states: processing (skeleton), ready
 * (with an accept-on-the-fly bucket proposal) and expiring (quiet amber decay
 * countdown). Composes SourceStamp · StatusBadge · BucketChip · Tag.
 */
export function ItemCard({
  source = 'article',
  sourceName,
  title,
  summary,
  tags = [],
  status = 'ready',
  proposedBucket,
  daysLeft,
  onAccept,
  onClick,
  style,
}) {
  const processing = status === 'processing';
  const expiring = status === 'expiring';

  return (
    <article
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: `1px solid ${expiring ? 'var(--status-expiring-soft)' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)',
        boxShadow: expiring ? 'var(--shadow-expiring)' : 'var(--shadow-sm)',
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Header: provenance + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
        <SourceStamp source={source} size="md" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)',
            letterSpacing: 'var(--t-meta-tracking)', textTransform: 'uppercase',
            color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {SOURCE_LABEL[source]}{sourceName ? ` · ${sourceName}` : ''}
          </div>
        </div>
        <StatusBadge status={status}>
          {expiring && daysLeft != null ? `In ${daysLeft} days` : undefined}
        </StatusBadge>
      </div>

      {/* Title */}
      {title && !processing ? (
        <h3 style={{
          margin: '0 0 6px', fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-heading)', lineHeight: 'var(--t-heading-lh)',
          fontWeight: 600, color: 'var(--text-primary)',
        }}>{title}</h3>
      ) : null}

      {/* Summary — the hero (or skeleton while processing) */}
      {processing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0 14px' }}>
          {[100, 92, 64].map((w, i) => (
            <span key={i} style={{
              height: 12, width: `${w}%`, borderRadius: 6,
              background: 'linear-gradient(90deg, var(--bg-sunken) 25%, var(--surface-hover) 37%, var(--bg-sunken) 63%)',
              backgroundSize: '400% 100%', animation: 'ib-shimmer 1.4s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <p style={{
          margin: '0 0 14px', fontFamily: 'var(--font-read)',
          fontSize: 'var(--t-read)', lineHeight: 'var(--t-read-lh)',
          color: 'var(--text-primary)',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{summary}</p>
      )}

      {/* Footer: bucket proposal + tags, or processing note */}
      {processing ? (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 'var(--t-micro)',
          letterSpacing: 'var(--t-micro-tracking)', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>Summarising · proposing a bucket…</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {proposedBucket ? (
            <BucketChip name={proposedBucket.name} isNew={proposedBucket.isNew} onAccept={onAccept} />
          ) : null}
          {tags.slice(0, 2).map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
      )}

      {/* Quiet decay line */}
      {expiring && !processing && daysLeft != null ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 'var(--t-micro)',
          letterSpacing: 'var(--t-micro-tracking)', textTransform: 'uppercase',
          color: 'var(--accent)',
        }}>
          <ClockIcon size={12} /> In {daysLeft} days → Archive
        </div>
      ) : null}

      <style>{`@keyframes ib-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
        @media (prefers-reduced-motion: reduce){[style*="ib-shimmer"]{animation:none!important}}`}</style>
    </article>
  );
}
