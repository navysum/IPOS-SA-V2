import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  padding?: string;
}

export function Card({ children, style, className, padding = '20px' }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: string;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ label, value, sub, icon, accent = 'var(--color-primary)', trend }: StatCardProps) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {label}
        </p>
        {icon && (
          <div style={{
            width: 36, height: 36,
            borderRadius: 'var(--radius-sm)',
            background: accent + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent,
          }}>
            {icon}
          </div>
        )}
      </div>
      <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-1)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
        {value}
      </p>
      {(sub || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {sub && <p style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{sub}</p>}
          {trend && (
            <span style={{
              fontSize: '11px', fontWeight: 600,
              color: trend.positive ? 'var(--color-success)' : 'var(--color-danger)',
            }}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
