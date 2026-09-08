import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, ArrowRight, Building2, UserCheck, Lock, Mail, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

export const LoginView: React.FC = () => {
  const { login, loginDemo } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      showToast('Signed in successfully', 'Welcome back to FOODSAFE.', 'success');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole, label: string) => {
    try {
      setLoading(true);
      setError(null);
      await loginDemo(role);
      showToast('Authenticated as ' + label, 'Session initialized with real database permissions.', 'info');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-md)',
          padding: '36px 32px'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              background: '#1e3a2f',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '12px'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: '#141413',
              lineHeight: 1.1
            }}
          >
            FOODSAFE
          </h1>
          <p style={{ fontSize: '13px', color: '#686862', marginTop: '6px' }}>
            Food Safety & Compliance Management
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={15}
                style={{ position: 'absolute', left: '11px', top: '10px', color: '#8c8c84' }}
              />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '34px' }}
                placeholder="consultant@demo.foodsafe"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{ position: 'absolute', left: '11px', top: '10px', color: '#8c8c84' }}
              />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '34px' }}
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: '6px', fontSize: '13.5px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* DEMO ACCESS SECTION (Specification Section 1 & 21) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#686862',
              marginBottom: '12px',
              textAlign: 'center'
            }}
          >
            Demo Access — One-Click Meeting Continuation
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                justifyContent: 'space-between',
                padding: '10px 14px',
                textAlign: 'left',
                border: '1px solid #d0d0c8'
              }}
              disabled={loading}
              onClick={() => handleDemoLogin('CONSULTANT', 'Consultant')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={16} color="#1e3a2f" />
                <div>
                  <div style={{ fontWeight: 700, color: '#141413', fontSize: '13px' }}>
                    Continue as Consultant
                  </div>
                  <div style={{ fontSize: '11px', color: '#686862' }}>
                    Command Centre • 2,147 Businesses • Review & Broadcast
                  </div>
                </div>
              </div>
              <ArrowRight size={14} color="#686862" />
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                justifyContent: 'space-between',
                padding: '10px 14px',
                textAlign: 'left',
                border: '1px solid #d0d0c8'
              }}
              disabled={loading}
              onClick={() => handleDemoLogin('CLIENT', 'Client (Shree Foods)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={16} color="#b45309" />
                <div>
                  <div style={{ fontWeight: 700, color: '#141413', fontSize: '13px' }}>
                    Continue as Client
                  </div>
                  <div style={{ fontSize: '11px', color: '#686862' }}>
                    Shree Foods Owner • What's Due & Evidence Upload
                  </div>
                </div>
              </div>
              <ArrowRight size={14} color="#686862" />
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                justifyContent: 'space-between',
                padding: '10px 14px',
                textAlign: 'left',
                border: '1px solid #d0d0c8'
              }}
              disabled={loading}
              onClick={() => handleDemoLogin('MANAGER', 'QA Manager')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={16} color="#4a4a46" />
                <div>
                  <div style={{ fontWeight: 700, color: '#141413', fontSize: '13px' }}>
                    Continue as Manager
                  </div>
                  <div style={{ fontSize: '11px', color: '#686862' }}>
                    Shree Foods QA Head • Assigned Tasks & Submissions
                  </div>
                </div>
              </div>
              <ArrowRight size={14} color="#686862" />
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#8c8c84'
          }}
        >
          FOODSAFE Platform • PostgreSQL Connected
        </div>
      </div>
    </div>
  );
};
