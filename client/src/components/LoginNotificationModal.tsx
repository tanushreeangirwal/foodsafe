import React from 'react';
import { User } from '../types';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  FileCheck2, 
  Radio, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface Props {
  user: User;
  onClose: () => void;
  onNavigate: (view: string, data?: any) => void;
}

export const LoginNotificationModal: React.FC<Props> = ({ user, onClose, onNavigate }) => {
  const isClient = user.role === 'CLIENT';
  const isConsultant = user.role === 'CONSULTANT';
  const isManager = user.role === 'MANAGER';
  const isStaff = user.role === 'STAFF';

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'CONSULTANT': return { bg: '#edf4f0', text: '#1e3a2f', border: '#a3c9b8' };
      case 'CLIENT': return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 'MANAGER': return { bg: '#f4f4f0', text: '#363634', border: '#d0d0c8' };
      case 'STAFF': return { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' };
    }
  };

  const badgeStyle = getRoleBadgeColor();

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '560px', 
          borderRadius: '16px', 
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          animation: 'slideUp 0.25s ease-out'
        }}
      >
        {/* Top Accent Banner */}
        <div 
          style={{ 
            background: isClient 
              ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' 
              : isConsultant 
              ? 'linear-gradient(135deg, #1e3a2f 0%, #285241 100%)'
              : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '16px',
              top: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Bell size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.9 }}>
                {isClient ? 'Action Required • Client Notice' : isConsultant ? 'Lead Consultant Briefing' : 'Facility Operational Alert'}
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '2px 0 0', color: '#ffffff' }}>
                Welcome, {user.name.split(' ')[0]}!
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span 
              className="badge" 
              style={{ 
                backgroundColor: badgeStyle.bg, 
                color: badgeStyle.text, 
                border: `1px solid ${badgeStyle.border}`,
                fontWeight: 700,
                fontSize: '11px'
              }}
            >
              {user.role}
            </span>
            {user.business_name && (
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                {user.business_name}
              </span>
            )}
          </div>

          <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5, marginBottom: '18px' }}>
            {isClient && (
              <span>
                You have <strong>2 urgent compliance deadlines</strong> and <strong>1 new statutory directive</strong> requiring your immediate attention for <strong>{user.business_name || 'Shree Foods'}</strong>.
              </span>
            )}
            {isConsultant && (
              <span>
                Here is your live compliance governance briefing across <strong>2,147 managed food businesses</strong>.
              </span>
            )}
            {isManager && (
              <span>
                You have <strong>3 operational facility checklists</strong> scheduled for inspection today at <strong>{user.business_name || 'Shree Foods'}</strong>.
              </span>
            )}
            {isStaff && (
              <span>
                You have <strong>2 active facility tasks</strong> assigned for your current work shift.
              </span>
            )}
          </p>

          {/* Targeted Notification Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {isClient && (
              <>
                <div 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    background: '#fef2f2', 
                    border: '1px solid #fecaca',
                    borderLeft: '4px solid #dc2626',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <AlertTriangle size={18} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#991b1b' }}>
                      FSSAI License Renewal — Expires in 12 Days
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '2px' }}>
                      Statutory renewal license copy must be uploaded to prevent suspension of facility operations.
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    background: '#fffdfa', 
                    border: '1px solid #fde68a',
                    borderLeft: '4px solid #b45309',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <Clock size={18} color="#b45309" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400e' }}>
                      Quarterly Water Potability Test (IS 10500) — Due in 5 Days
                    </div>
                    <div style={{ fontSize: '12px', color: '#78350f', marginTop: '2px' }}>
                      NABL accredited laboratory test report required for bacterial and chemical potability check.
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #2563eb',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <Radio size={18} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>
                      FSSAI Mandate: Updated Heavy Metal Limits
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                      New enforcement circular published for pickle and processed condiment units.
                    </div>
                  </div>
                </div>
              </>
            )}

            {isConsultant && (
              <>
                <div 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    background: '#f0fdf4', 
                    border: '1px solid #bbf7d0',
                    borderLeft: '4px solid #16a34a',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <FileCheck2 size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#166534' }}>
                      3 Evidence Submissions Awaiting Your Review
                    </div>
                    <div style={{ fontSize: '12px', color: '#14532d', marginTop: '2px' }}>
                      Shree Foods and Annapurna Foods submitted test certificates awaiting verification.
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    background: '#fef2f2', 
                    border: '1px solid #fecaca',
                    borderLeft: '4px solid #dc2626',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <ShieldAlert size={18} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#991b1b' }}>
                      8 Managed Establishments in Critical State
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '2px' }}>
                      Expired food safety licences require immediate consultant advisory notices.
                    </div>
                  </div>
                </div>
              </>
            )}

            {(isManager || isStaff) && (
              <>
                <div 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #2563eb',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <CheckCircle2 size={18} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>
                      Floor & Equipment Sanitization Checklist
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                      Scheduled for completion before start of morning production run.
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: '8px', 
                    background: '#fffdfa', 
                    border: '1px solid #fde68a',
                    borderLeft: '4px solid #b45309',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <Clock size={18} color="#b45309" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400e' }}>
                      Water Quality Verification & Lab Batch Dispatch
                    </div>
                    <div style={{ fontSize: '12px', color: '#78350f', marginTop: '2px' }}>
                      Sample collection from main storage tank due by 12:00 PM.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              Dismiss
            </button>

            {isClient && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onNavigate('whats-due');
                }}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  backgroundColor: '#b45309',
                  borderColor: '#b45309',
                  padding: '8px 18px',
                  fontSize: '13px'
                }}
              >
                Review What's Due
                <ArrowRight size={14} />
              </button>
            )}

            {isConsultant && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onNavigate('documents-review');
                }}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  backgroundColor: '#1e3a2f',
                  borderColor: '#1e3a2f',
                  padding: '8px 18px',
                  fontSize: '13px'
                }}
              >
                Go to Review Queue
                <ArrowRight size={14} />
              </button>
            )}

            {(isManager || isStaff) && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onNavigate('tasks');
                }}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '8px 18px',
                  fontSize: '13px'
                }}
              >
                View My Tasks
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
