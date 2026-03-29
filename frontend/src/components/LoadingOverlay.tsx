import React from 'react';

export function LoadingOverlay({ message = 'Loading…' }: { message?: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-surface)', zIndex: 9999,
    }}>
      <div style={{
        width: 48, height: 48,
        background: 'var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '20px',
      }}>IP</div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-primary)',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <p style={{ fontSize: '13px', color: 'var(--color-text-3)', fontFamily: 'var(--font-ui)' }}>
        {message}
      </p>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.0); opacity: 1.0; }
        }
      `}</style>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      padding: '12px 20px',
      background: 'var(--color-danger-bg)', borderBottom: '1px solid #fca5a5',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'var(--font-ui)', fontSize: '13px', color: '#991b1b',
    }}>
      <span>
        <strong>⚠ Backend connection error:</strong> {message}
      </span>
      {onRetry && (
        <button onClick={onRetry}
          style={{ marginLeft: '16px', padding: '4px 12px', borderRadius: '6px',
            border: '1px solid #fca5a5', background: '#fee2e2', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>
          Retry
        </button>
      )}
    </div>
  );
}
