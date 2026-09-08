import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Building2, 
  Layers, 
  Radio, 
  FileCheck2, 
  History, 
  Clock, 
  FileText, 
  CheckSquare,
  Settings,
  LogOut,
  Bell
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  pendingReviewCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  pendingReviewCount = 0 
}) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'CONSULTANT';

  return (
    <aside className="sidebar">
      {/* Brand Header (Specification Section 3) */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <ShieldCheck size={20} />
        </div>
        <div className="brand-text">
          <h1>FOODSAFE</h1>
          <p>Compliance Platform</p>
        </div>
      </div>

      {/* Navigation Links by Role (Specification Section 4 & 23) */}
      <nav className="sidebar-nav">
        {role === 'CONSULTANT' && (
          <>
            <div className="nav-section-title">Compliance Governance</div>
            <button
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button
              className={`nav-item ${currentView === 'businesses' ? 'active' : ''}`}
              onClick={() => onNavigate('businesses')}
            >
              <Building2 size={16} />
              Businesses
            </button>
            <button
              className={`nav-item ${currentView === 'templates' ? 'active' : ''}`}
              onClick={() => onNavigate('templates')}
            >
              <Layers size={16} />
              Requirements
            </button>

            <div className="nav-section-title">Operations & Broadcast</div>
            <button
              className={`nav-item ${currentView === 'regulatory' ? 'active' : ''}`}
              onClick={() => onNavigate('regulatory')}
            >
              <Radio size={16} />
              Regulatory Updates
            </button>
            <button
              className={`nav-item ${currentView === 'documents-review' ? 'active' : ''}`}
              onClick={() => onNavigate('documents-review')}
            >
              <FileCheck2 size={16} />
              Evidence Review
              {pendingReviewCount > 0 && (
                <span className="nav-badge danger">{pendingReviewCount}</span>
              )}
            </button>
            <button
              className={`nav-item ${currentView === 'audit' ? 'active' : ''}`}
              onClick={() => onNavigate('audit')}
            >
              <History size={16} />
              Audit Trail
            </button>
            <button
              className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => onNavigate('settings')}
            >
              <Settings size={16} />
              Settings
            </button>
          </>
        )}

        {role === 'CLIENT' && (
          <>
            <div className="nav-section-title">My Compliance</div>
            <button
              className={`nav-item ${currentView === 'whats-due' ? 'active' : ''}`}
              onClick={() => onNavigate('whats-due')}
            >
              <Clock size={16} />
              What's Due
            </button>
            <button
              className={`nav-item ${currentView === 'documents' ? 'active' : ''}`}
              onClick={() => onNavigate('documents')}
            >
              <FileText size={16} />
              Documents
            </button>
            <button
              className={`nav-item ${currentView === 'regulatory' ? 'active' : ''}`}
              onClick={() => onNavigate('regulatory')}
            >
              <Radio size={16} />
              Regulatory Updates
            </button>
            <button
              className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => onNavigate('settings')}
            >
              <Settings size={16} />
              Settings
            </button>
          </>
        )}

        {role === 'MANAGER' && (
          <>
            <div className="nav-section-title">Facility Tasks</div>
            <button
              className={`nav-item ${currentView === 'tasks' ? 'active' : ''}`}
              onClick={() => onNavigate('tasks')}
            >
              <CheckSquare size={16} />
              My Tasks
            </button>
            <button
              className={`nav-item ${currentView === 'documents' ? 'active' : ''}`}
              onClick={() => onNavigate('documents')}
            >
              <FileText size={16} />
              Documents
            </button>
            <button
              className={`nav-item ${currentView === 'regulatory' ? 'active' : ''}`}
              onClick={() => onNavigate('regulatory')}
            >
              <Radio size={16} />
              Regulatory Updates
            </button>
          </>
        )}
      </nav>

      {/* User Profile & Logout Bottom Bar (Section 21) */}
      <div className="sidebar-user">
        <div className="user-profile-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: role === 'CONSULTANT' ? '#285241' : '#b45309',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0
              }}
            >
              {user?.name.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f4f4f0' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '10.5px', color: '#8c8c84' }}>
                {role === 'CONSULTANT' ? 'Lead Consultant' : user?.business_name || role}
              </div>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={logout}
            title="Sign out and return to login"
          >
            <LogOut size={12} />
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
};
