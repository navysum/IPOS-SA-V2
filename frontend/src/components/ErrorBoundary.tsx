import React from 'react';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('IPOS-SA crash:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f0f4f8', padding: '40px',
        }}>
          <div style={{
            background: '#fff', border: '1px solid #fca5a5', borderRadius: '12px',
            padding: '32px', maxWidth: '640px', width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,.08)',
          }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
              ⚠ Application Error
            </p>
            <p style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '20px' }}>
              The app crashed. Copy the error below and share it for a fix.
            </p>
            <pre style={{
              background: '#1e1e1e', color: '#f8d7da', padding: '16px',
              borderRadius: '8px', fontSize: '12px', whiteSpace: 'pre-wrap',
              overflowX: 'auto', lineHeight: 1.6,
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              style={{
                marginTop: '20px', padding: '8px 20px', background: '#0ea5e9',
                color: '#fff', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
