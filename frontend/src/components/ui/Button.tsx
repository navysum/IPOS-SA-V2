import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  fontFamily: 'var(--font-ui)',
  fontWeight: 600,
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'background .15s, opacity .15s, box-shadow .15s',
  whiteSpace: 'nowrap',
  letterSpacing: '.01em',
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { fontSize: '12px', padding: '5px 12px', height: '30px' },
  md: { fontSize: '13px', padding: '7px 16px', height: '36px' },
  lg: { fontSize: '14px', padding: '10px 22px', height: '42px' },
};

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--color-primary)',  color: '#fff' },
  secondary: { background: 'var(--color-border)',   color: 'var(--color-text-1)', border: '1px solid var(--color-border-2)' },
  ghost:     { background: 'transparent',           color: 'var(--color-text-2)', border: '1px solid var(--color-border)' },
  danger:    { background: 'var(--color-danger)',   color: '#fff' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{
        ...base,
        ...sizeStyles[size],
        ...variantStyles[variant],
        opacity: (disabled || loading) ? .55 : 1,
        ...style,
      }}
    >
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
