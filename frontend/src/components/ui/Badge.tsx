import React from 'react';
import type { AccountStatus, OrderStatus, PaymentStatus } from '@/types';

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--color-primary-bg)', color: 'var(--color-primary-dk)' },
  success: { background: 'var(--color-success-bg)', color: '#065f46' },
  warning: { background: 'var(--color-warning-bg)', color: '#92400e' },
  danger:  { background: 'var(--color-danger-bg)',  color: '#991b1b' },
  neutral: { background: 'var(--color-border)',     color: 'var(--color-text-2)' },
};

export function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
  return (
    <span style={{
      ...variantStyles[variant],
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: size === 'sm' ? '2px 7px' : '3px 10px',
      borderRadius: '99px',
      fontSize: size === 'sm' ? '11px' : '12px',
      fontWeight: 600, letterSpacing: '.02em', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const map: Record<AccountStatus, { label: string; variant: Variant }> = {
    normal:     { label: 'Normal',     variant: 'success' },
    suspended:  { label: 'Suspended',  variant: 'warning' },
    in_default: { label: 'In Default', variant: 'danger'  },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// Updated to include ready_to_dispatch from spec checklist
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; variant: Variant }> = {
    submitted:         { label: 'Submitted',          variant: 'neutral'  },
    accepted:          { label: 'Accepted',            variant: 'primary'  },
    ready_to_dispatch: { label: 'Ready to Dispatch',   variant: 'warning'  },
    dispatched:        { label: 'Dispatched',          variant: 'warning'  },
    delivered:         { label: 'Delivered',           variant: 'success'  },
    cancelled:         { label: 'Cancelled',           variant: 'danger'   },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; variant: Variant }> = {
    pending:  { label: 'Pending', variant: 'warning' },
    received: { label: 'Paid',    variant: 'success' },
    overdue:  { label: 'Overdue', variant: 'danger'  },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
