import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Bell, 
  ShieldCheck, 
  Sliders, 
  Save, 
  Building2, 
  Mail, 
  Key, 
  CheckCircle2 
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalSms, setCriticalSms] = useState(true);
  const [leadTimeDays, setLeadTimeDays] = useState(30);
  const [auditRetention, setAuditRetention] = useState('365');
  const [autoEscalate, setAutoEscalate] = useState(true);

  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Settings Saved', 'Your system preferences and alert policies have been updated.', 'success');
    }, 400);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
          Platform & Governance Settings
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Configure compliance thresholds, alert dispatch cadences, and workspace access preferences.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* User Account Profile Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserIcon size={18} color="#2563eb" />
              <h2 className="card-title">User Account Profile</h2>
            </div>
            <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 700 }}>
              {user?.role || 'CONSULTANT'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                defaultValue={user?.name || 'Lead Food Safety Consultant'} 
              />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                defaultValue={user?.email || 'consultant@demo.foodsafe'} 
              />
            </div>
            <div>
              <label className="form-label">Assigned Organization / Entity</label>
              <input 
                type="text" 
                className="form-input" 
                readOnly 
                value={user?.business_name || 'FOODSAFE Central Consultancy Services'} 
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>
          </div>
        </div>

        {/* Compliance Thresholds & Automated Cadences */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={18} color="#059669" />
              <h2 className="card-title">Compliance Alert Thresholds & Horizons</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label className="form-label">Default Expiry Advance Notice (Days)</label>
              <select 
                className="form-select" 
                value={leadTimeDays} 
                onChange={e => setLeadTimeDays(Number(e.target.value))}
              >
                <option value={15}>15 Days Before Expiry</option>
                <option value={30}>30 Days Before Expiry (Recommended)</option>
                <option value={45}>45 Days Before Expiry</option>
                <option value={60}>60 Days Before Expiry</option>
              </select>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Requirements entering this horizon will be marked as "Due Soon" and highlighted in the dashboard.
              </p>
            </div>

            <div>
              <label className="form-label">Audit Trail Log Retention</label>
              <select 
                className="form-select" 
                value={auditRetention} 
                onChange={e => setAuditRetention(e.target.value)}
              >
                <option value="180">6 Months (180 days)</option>
                <option value="365">1 Year (365 days - Statutory default)</option>
                <option value="730">2 Years (730 days)</option>
                <option value="1825">5 Years (Regulatory inspection ready)</option>
              </select>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Maintains non-repudiable audit records of all evidence uploads and verification reviews.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={emailAlerts} 
                onChange={e => setEmailAlerts(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>
                  Email Notifications for Overdue Items
                </span>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Dispatch automated email digests to plant managers when compliance testing becomes overdue.
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={criticalSms} 
                onChange={e => setCriticalSms(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>
                  Instant Broadcast for Critical Statutory Mandates
                </span>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Immediately trigger priority modal banners for all client facilities when an FSSAI emergency directive is published.
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoEscalate} 
                onChange={e => setAutoEscalate(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>
                  Auto-Escalate Unreviewed Evidence
                </span>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Highlight evidence documents in queue if pending verification exceeds 48 hours.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* System & Architecture Status Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="#7c3aed" />
              <h2 className="card-title">System & Security Information</h2>
            </div>
            <span className="badge badge-compliant">
              <CheckCircle2 size={12} /> System Healthy
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11.5px' }}>Platform Version:</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>FOODSAFE v1.0.0-poc</div>
            </div>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11.5px' }}>Environment:</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Demonstration & Pilot Mode</div>
            </div>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11.5px' }}>Data Isolation:</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Multi-Tenant Row-Level Isolated</div>
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
