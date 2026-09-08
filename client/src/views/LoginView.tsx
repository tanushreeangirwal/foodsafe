import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Lock,
  Mail,
  AlertCircle,
  Wrench,
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';
import { UserRole } from '../types';

interface DemoRoleConfig {
  role: UserRole;
  label: string;
  name: string;
  org: string;
  email: string;
  passwordDisplay: string;
  color: string;
  bgLight: string;
  borderLight: string;
  icon: React.ReactNode;
  scope: string;
}

const ROLES: DemoRoleConfig[] = [
  {
    role: 'CONSULTANT',
    label: 'Consultant',
    name: 'Pravin Kale',
    org: 'Lead Food Safety Consultant',
    email: 'consultant@demo.foodsafe',
    passwordDisplay: 'FoodSafe2026!',
    color: '#1e3a2f',
    bgLight: '#edf4f0',
    borderLight: '#a3c9b8',
    icon: <ShieldCheck size={18} color="#1e3a2f" />,
    scope: 'Command Centre • 2,147 Businesses • Audit Reviews & System Broadcasts'
  },
  {
    role: 'CLIENT',
    label: 'Client',
    name: 'Rajesh Sharma',
    org: 'Shree Foods Owner',
    email: 'client@demo.foodsafe',
    passwordDisplay: 'FoodSafe2026!',
    color: '#b45309',
    bgLight: '#fffbeb',
    borderLight: '#fde68a',
    icon: <Building2 size={18} color="#b45309" />,
    scope: 'Client Dashboard • What\'s Due • Direct Evidence & Document Upload'
  },
  {
    role: 'MANAGER',
    label: 'QA Manager',
    name: 'Santosh Kamble',
    org: 'Shree Foods QA Head',
    email: 'manager@demo.foodsafe',
    passwordDisplay: 'FoodSafe2026!',
    color: '#363634',
    bgLight: '#f4f4f0',
    borderLight: '#d0d0c8',
    icon: <UserCheck size={18} color="#363634" />,
    scope: 'Operational Audits • Daily Checklists • Staff Task Verification'
  },
  {
    role: 'STAFF',
    label: 'Staff',
    name: 'Deepak Patil',
    org: 'Shree Foods Ground Operations',
    email: 'staff@demo.foodsafe',
    passwordDisplay: 'FoodSafe2026!',
    color: '#0369a1',
    bgLight: '#f0f9ff',
    borderLight: '#bae6fd',
    icon: <Wrench size={18} color="#0369a1" />,
    scope: 'Floor Tasks • Temperature Logs • Cleaning Checklist Execution'
  }
];

export const LoginView: React.FC = () => {
  const { login, loginDemo } = useAuth();
  const { showToast } = useToast();

  // Pre-fill default role credentials (Consultant)
  const [selectedRole, setSelectedRole] = useState<UserRole>('CONSULTANT');
  const [email, setEmail] = useState('consultant@demo.foodsafe');
  const [password, setPassword] = useState('FoodSafe2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When clicking a role card: auto-populate email & password, and immediately log in
  const handleRoleClick = async (roleConfig: DemoRoleConfig) => {
    setSelectedRole(roleConfig.role);
    setEmail(roleConfig.email);
    setPassword(roleConfig.passwordDisplay);
    setError(null);
    setLoading(true);

    try {
      await loginDemo(roleConfig.role);
      showToast(
        `Signed in as ${roleConfig.label}`,
        `Authenticated as ${roleConfig.name} (${roleConfig.org})`,
        'success'
      );
    } catch (err: any) {
      // Direct fallback authentication
      await login(roleConfig.email, roleConfig.passwordDisplay);
      showToast(`Signed in as ${roleConfig.label}`, 'Welcome to FOODSAFE.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      showToast('Signed in successfully', 'Welcome back to FOODSAFE.', 'success');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
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
        padding: '24px 16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
          padding: '36px 32px'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: '#1e3a2f',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(30, 58, 47, 0.2)'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#141413',
              lineHeight: 1.15
            }}
          >
            FOODSAFE
          </h1>
          <p style={{ fontSize: '13px', color: '#686862', marginTop: '4px' }}>
            Food Safety & Compliance Management Operating System
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '10px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#14532d',
              fontSize: '11.5px',
              fontWeight: 600
            }}
          >
            <Sparkles size={12} color="#16a34a" />
            Click any role below to instantly log in
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* ROLE SELECTION BUTTONS (Click any role to log in as that) */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#1e3a2f',
              marginBottom: '10px'
            }}
          >
            Select Role to Log In:
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}
          >
            {ROLES.map(r => {
              const isSelected = selectedRole === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleClick(r)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: isSelected ? `2px solid ${r.color}` : '1px solid var(--border-subtle)',
                    background: isSelected ? r.bgLight : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      marginBottom: '6px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: r.bgLight,
                        border: `1px solid ${r.borderLight}`
                      }}
                    >
                      {r.icon}
                    </div>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: r.color,
                          background: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          border: `1px solid ${r.borderLight}`
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#141413' }}>
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: '#686862',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      marginTop: '2px'
                    }}
                  >
                    {r.email}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CREDENTIALS FORM (Email and Password Present) */}
        <form onSubmit={handleManualSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={15}
                style={{ position: 'absolute', left: '11px', top: '10px', color: '#8c8c84' }}
              />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{ position: 'absolute', left: '11px', top: '10px', color: '#8c8c84' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : `Log In as ${selectedRole}`}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Footer Notice without database/postgres text */}
        <div
          style={{
            marginTop: '24px',
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
