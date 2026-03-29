import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, width = 540, footer }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(13,27,42,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
        animation: 'fadeUp .18s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: '0 16px',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-1)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-3)', padding: '4px', borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form Field helper ─────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

export function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)' }}>
        {label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>{hint}</p>}
      {error && <p style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 500 }}>{error}</p>}
    </div>
  );
}

// ── Input helper ──────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, style, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-2)'}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: '13px',
        fontFamily: 'var(--font-ui)',
        color: 'var(--color-text-1)',
        background: 'var(--color-surface)',
        outline: 'none',
        transition: 'border-color .15s',
        ...style,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border-2)'; }}
    />
  );
}

export function Select({ error, style, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      {...rest}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-2)'}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: '13px',
        fontFamily: 'var(--font-ui)',
        color: 'var(--color-text-1)',
        background: 'var(--color-surface)',
        outline: 'none',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </select>
  );
}
