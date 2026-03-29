import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Modal';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--color-sidebar-bg)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        background: 'linear-gradient(135deg, #0d1b2a 0%, #162032 50%, #0d1b2a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: .04,
          backgroundImage: 'linear-gradient(rgba(14,165,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div style={{
              width: 48, height: 48,
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 800, color: '#fff',
            }}>IP</div>
            <div>
              <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>InfoPharma Ltd</p>
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '12px', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Ordering System · Server Application
              </p>
            </div>
          </div>
          <h2 style={{ color: '#fff', fontSize: '36px', fontWeight: 700, lineHeight: 1.2, maxWidth: '380px' }}>
            Powering pharmaceutical distribution
          </h2>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '14px', marginTop: '16px', maxWidth: '340px', lineHeight: 1.7 }}>
            Manage your catalogue, orders, merchant accounts, and generate reports — all in one place.
          </p>
          {/* Demo credentials hint */}
          <div style={{
            marginTop: '48px',
            padding: '16px',
            background: 'rgba(14,165,233,.08)',
            border: '1px solid rgba(14,165,233,.2)',
            borderRadius: 'var(--radius-md)',
            maxWidth: '320px',
          }}>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>
              Demo Credentials
            </p>
            {[
              { role: 'Admin (Sysdba)', u: 'Sysdba',  p: 'London_weighting' },
              { role: 'Manager',        u: 'manager', p: 'Get_it_done' },
              { role: 'Merchant (City)', u: 'city',   p: 'northampton' },
            ].map(({ role, u, p }) => (
              <div key={role} style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-primary)', fontSize: '11px', fontFamily: 'var(--font-mono)', width: '60px' }}>{role}</span>
                <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{u} / {p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: '420px',
        flexShrink: 0,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-1)', marginBottom: '6px' }}>
          Sign in
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-3)', marginBottom: '36px' }}>
          Access the IPOS Server Application
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Field label="Username" required>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
            />
          </Field>

          <Field label="Password" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Field>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--color-danger-bg)',
              border: '1px solid #fca5a5',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: '#991b1b',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            style={{ width: '100%', marginTop: '4px' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p style={{ marginTop: '32px', fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'center' }}>
          IPOS-SA v1.0 · InfoPharma Ltd · Prototype
        </p>
      </div>
    </div>
  );
}
