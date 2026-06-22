import React from 'react';

const sizes = {
  sm: { padding: '0 12px', height: 34, font: 'var(--t-body-sm)', radius: 'var(--r-sm)', gap: 6 },
  md: { padding: '0 16px', height: 44, font: 'var(--t-body)',    radius: 'var(--r-md)', gap: 8 },
  lg: { padding: '0 20px', height: 52, font: 'var(--t-subheading)', radius: 'var(--r-md)', gap: 9 },
};

const variants = {
  primary:     { bg: 'var(--primary)',     fg: 'var(--text-on-primary)', bd: 'transparent', shadow: 'var(--shadow-sm)' },
  secondary:   { bg: 'var(--surface)',     fg: 'var(--text-primary)',    bd: 'var(--border-strong)', shadow: 'none' },
  ghost:       { bg: 'transparent',        fg: 'var(--primary)',         bd: 'transparent', shadow: 'none' },
  destructive: { bg: 'var(--danger-soft)', fg: 'var(--danger)',          bd: 'transparent', shadow: 'none' },
};

/**
 * Button — the primary action control. Label is the same name used everywhere
 * in the flow (Save, not Submit). Bricolage Grotesque, medium weight.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.height,
        minHeight: 'var(--touch-min)',
        padding: s.padding,
        fontFamily: 'var(--font-ui)',
        fontSize: s.font,
        fontWeight: 600,
        lineHeight: 1,
        color: v.fg,
        background: v.bg,
        border: `1.5px solid ${v.bd}`,
        borderRadius: s.radius,
        boxShadow: v.shadow,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background .15s ease, transform .06s ease, box-shadow .15s ease',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      {...rest}
    >
      {iconLeft ? <span style={{ display: 'inline-flex', width: 18, height: 18 }}>{iconLeft}</span> : null}
      {children}
      {iconRight ? <span style={{ display: 'inline-flex', width: 18, height: 18 }}>{iconRight}</span> : null}
    </button>
  );
}
