import React from 'react';

/**
 * TextField — labelled single-line input (bucket name, manual URL, etc.).
 * Bricolage label in catalog-quiet style; clear focus ring for accessibility.
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  type = 'text',
  iconLeft = null,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'var(--danger)' : focused ? 'var(--primary)' : 'var(--border-strong)';
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
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface)', border: `1.5px solid ${borderColor}`,
        borderRadius: 'var(--r-sm)', padding: '0 12px',
        minHeight: 'var(--touch-min)',
        boxShadow: focused ? '0 0 0 3px var(--primary-soft)' : 'none',
        transition: 'border-color .15s, box-shadow .15s',
      }}>
        {iconLeft ? <span style={{ display: 'inline-flex', color: 'var(--text-tertiary)', flex: 'none' }}>{iconLeft}</span> : null}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body)', color: 'var(--text-primary)',
            padding: '12px 0',
          }}
          {...rest}
        />
      </span>
      {error || hint ? (
        <span style={{
          display: 'block', marginTop: 6, fontFamily: 'var(--font-ui)',
          fontSize: 'var(--t-body-sm)', color: error ? 'var(--danger)' : 'var(--text-tertiary)',
        }}>{error || hint}</span>
      ) : null}
    </label>
  );
}
