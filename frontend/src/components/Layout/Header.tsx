import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header style={{
      height: 'var(--header-h)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div>
        <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-1)', lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '1px' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {actions}
      </div>
    </header>
  );
}

// ── Page wrapper ──────────────────────────────

interface PageProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Page({ children, title, subtitle, actions }: PageProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Header title={title} subtitle={subtitle} actions={actions} />
      <main className="page-enter" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {children}
      </main>
    </div>
  );
}

// ── Page section heading ──────────────────────

interface SectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Section({ title, subtitle, actions }: SectionProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-1)' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
