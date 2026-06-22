import React from 'react';
import { MicIcon } from '../core/icons.jsx';

/**
 * NoteField — multi-line note input with a dictation affordance. The mic sits
 * in the bottom-right; `recording` shows it active (pulsing). The note reads in
 * Newsreader, matching the summary it sits beside.
 */
export function NoteField({
  label = 'Note',
  value,
  onChange,
  placeholder = 'Add a note, or dictate one…',
  recording = false,
  onDictate,
  rows = 3,
  style,
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <label style={{ display: 'block', ...style }}>
      {label ? (
        <span style={{
          display: 'block', marginBottom: 7, fontFamily: 'var(--font-mono)',
          fontSize: 'var(--t-label)', letterSpacing: 'var(--t-label-tracking)',
          textTransform: 'uppercase', color: 'var(--text-secondary)',
        }}>{label}</span>
      ) : null}
      <span style={{
        display: 'block', position: 'relative',
        background: 'var(--surface)',
        border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--r-sm)', padding: '12px 12px 12px',
        boxShadow: focused ? '0 0 0 3px var(--primary-soft)' : 'none',
        transition: 'border-color .15s, box-shadow .15s',
      }}>
        <textarea
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          rows={rows}
          style={{
            width: '100%', resize: 'none', border: 0, outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-read)', fontSize: 'var(--t-read-sm)', lineHeight: 'var(--t-read-sm-lh)',
            color: 'var(--text-primary)', display: 'block', paddingRight: 36, boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={onDictate}
          aria-label={recording ? 'Stop dictation' : 'Dictate note'}
          style={{
            position: 'absolute', right: 8, bottom: 8,
            display: 'grid', placeItems: 'center', width: 34, height: 34,
            borderRadius: '50%', border: 0, cursor: 'pointer',
            color: recording ? 'var(--text-on-primary)' : 'var(--primary)',
            background: recording ? 'var(--primary)' : 'var(--primary-soft)',
            animation: recording ? 'ib-rec 1.2s ease-in-out infinite' : 'none',
          }}
        >
          <MicIcon size={17} />
        </button>
        <style>{`@keyframes ib-rec{0%,100%{box-shadow:0 0 0 0 var(--primary-soft)}50%{box-shadow:0 0 0 6px transparent}}
          @media (prefers-reduced-motion: reduce){[style*="ib-rec"]{animation:none!important}}`}</style>
      </span>
    </label>
  );
}
