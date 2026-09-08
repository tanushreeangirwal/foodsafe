import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  ArrowRight,
  Building2,
  UserCheck,
  Lock,
  Mail,
  AlertCircle,
  Wrench,
  Sparkles,
  KeyRound,
  Check
} from 'lucide-react';
import { UserRole } from '../types';

interface DemoAccount {
  role: UserRole;
  label: string;
  name: string;
  org: string;
  email: string;
  scope: string;
  color: string;
  bgLight: string;
  borderLight: string;
  icon: React.ReactNode;
}

export const LoginView: React.FC = () => {
  const { login, loginDemo } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const demoAccounts: DemoAccount[] = [
    {
      role: 'CONSULTANT',
      label: 'Consultant',
      name: 'Pravin Kale',
      org: 'Lead Food Safety Consultant',
      email: 'consultant@demo.foodsafe',
      scope: 'Full Command Centre • All 2,147 Businesses • Audit Reviews & System Broadcasts',
      color: '#1e3a2f',
      bgLight: '#edf4f0',
      borderLight: '#a3c9b8',
      icon: <ShieldCheck size={18} color="#1e3a2f" />
    },
    {
      role: 'CLIENT',
      label: 'Client (Owner)',
      name: 'Rajesh Sharma',
      org: 'Shree Foods Owner',
      email: 'client@demo.foodsafe',
      scope: 'Client Dashboard • Active Non-Compliances • Direct Document & Evidence Upload',
      color: '#b45309',
      bgLight: '#fffbeb',
      borderLight: '#fde68a',
      icon: <Building2 size={18} color="#b45309" />
    },
    {
      role: 'MANAGER',
      label: 'QA Manager',
      name: 'Santosh Kamble',
      org: 'Shree Foods QA Head',
      email: 'manager@demo.foodsafe',
      scope: 'Operational Audits • Daily Checklists • Staff Task Approvals & Corrective Actions',
      color: '#363634',
      bgLight: '#f4f4f0',
      borderLight: '#d0d0c8',
      icon: <UserCheck size={18} color="#363634" />
    },
    {
      role: 'STAFF',
      label: 'Facility Staff',
      name: 'Deepak Patil',
      org: 'Shree Foods Ground Ops',
      email: 'staff@demo.foodsafe',
      scope: 'Floor Operations • Temperature Logs & Preventive Maintenance Task Logging',
      color: '#0369a1',
      bgLight: '#f0f9ff',
      borderLight: '#bae6fd',
      icon: <Wrench size={18} color="#0369a1" />
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
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
      showToast('Authenticated as ' + label, 'Logged in without password for demo mode.', 'info');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword('');
    setCopiedEmail(acc.email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '32px 20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          padding: '36px 36px',
          overflow: 'hidden'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              background: '#1e3a2f',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '14px',
              boxShadow: '0 4px 12px rgba(30, 58, 47, 0.25)'
            }}
          >
            <ShieldCheck size={30} />
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#141413',
              lineHeight: 1.15
            }}
          >
            FOODSAFE
          </h1>
          <p style={{ fontSize: '13.5px', color: '#686862', marginTop: '6px' }}>
            Food Safety & Statutory Compliance Operating System
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#14532d',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Sparkles size={13} color="#16a34a" />
            Interactive Demo Mode Active — Password Not Required
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px'
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px',
            alignItems: 'start'
          }}
        >
          {/* Column 1: Role-Based 1-Click Access with Visible Credentials */}
          <div
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '22px 20px'
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: '#1e3a2f',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <KeyRound size={14} />
                Role-Based Credentials & Quick Access
              </div>
              <p style={{ fontSize: '12px', color: '#686862', marginTop: '4px' }}>
                Credentials pre-configured for each persona. Click any role to enter instantly without entering a password.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {demoAccounts.map(acc => (
                <div
                  key={acc.role}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '14px 14px',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: acc.bgLight,
                          border: `1px solid ${acc.borderLight}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {acc.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#141413' }}>
                          {acc.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#686862' }}>
                          {acc.name} • {acc.org}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        background: '#f0fdf4',
                        color: '#166534',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: '1px solid #bbf7d0'
                      }}
                    >
                      No Password
                    </span>
                  </div>

                  {/* Visible Credential Box */}
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      color: '#222220',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}
                  >
                    <div>
                      <span style={{ color: '#8c8c84', marginRight: '6px' }}>Email:</span>
                      <strong>{acc.email}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      title="Copy to form"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#1e3a2f',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {copiedEmail === acc.email ? (
                        <>
                          <Check size={11} color="#16a34a" /> Copied
                        </>
                      ) : (
                        'Use in form'
                      )}
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: '#686862', marginBottom: '10px', lineHeight: 1.35 }}>
                    {acc.scope}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      borderColor: '#d0d0c8',
                      color: '#141413'
                    }}
                    disabled={loading}
                    onClick={() => handleDemoLogin(acc.role, acc.label)}
                  >
                    <span>Sign In as {acc.label}</span>
                    <ArrowRight size={13} style={{ marginLeft: '4px' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Standard Sign In Form with Demo Bypass */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <div>
              <div style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: '#686862',
                    marginBottom: '4px'
                  }}
                >
                  Direct Sign-In
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#141413' }}>
                  Sign In with Email
                </h2>
                <p style={{ fontSize: '12.5px', color: '#686862', marginTop: '2px' }}>
                  For demo access, enter any demo email above. Password is completely optional.
                </p>
              </div>

              {/* Quick Fill Chips */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4a4a46', marginBottom: '6px', display: 'block' }}>
                  Quick Fill Demo Account:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {demoAccounts.map(acc => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      style={{
                        border: email === acc.email ? '1px solid #1e3a2f' : '1px solid #d0d0c8',
                        background: email === acc.email ? '#edf4f0' : '#ffffff',
                        color: email === acc.email ? '#1e3a2f' : '#363634',
                        borderRadius: '999px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '12.5px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={15}
                      style={{ position: 'absolute', left: '12px', top: '11px', color: '#8c8c84' }}
                    />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '36px', fontSize: '13px' }}
                      placeholder="consultant@demo.foodsafe"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}
                  >
                    <label className="form-label" style={{ fontSize: '12.5px', marginBottom: 0 }}>
                      Password
                    </label>
                    <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                      Optional for demo accounts
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={15}
                      style={{ position: 'absolute', left: '12px', top: '11px', color: '#8c8c84' }}
                    />
                    <input
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '36px', fontSize: '13px' }}
                      placeholder="Leave empty for demo — no password required"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#8c8c84', marginTop: '5px' }}>
                    Demo accounts bypass password authentication. Production accounts require verified credentials.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    borderRadius: '8px'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            </div>

            {/* Platform Feature Notice */}
            <div
              style={{
                marginTop: '28px',
                padding: '14px',
                borderRadius: '8px',
                background: '#fbfbfa',
                border: '1px solid var(--border-subtle)',
                fontSize: '11.5px',
                color: '#686862',
                lineHeight: 1.45
              }}
            >
              <div style={{ fontWeight: 600, color: '#141413', marginBottom: '4px' }}>
                Role-Based Access Control (RBAC)
              </div>
              Each user persona is partitioned into specific views, permissions, and audit logs. You can switch between roles anytime via the sidebar during the demonstration.
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '11.5px',
            color: '#8c8c84'
          }}
        >
          FOODSAFE Platform • Multi-Role Enterprise Edition
        </div>
      </div>
    </div>
  );
};
