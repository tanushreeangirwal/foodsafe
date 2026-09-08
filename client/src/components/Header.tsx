import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldCheck, UserCheck, Building2, CheckCircle2, ChevronDown, LogOut, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api';
import { AppNotification } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { user, switchRole, logout } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifs, setShowNotifs] = useState<boolean>(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiRequest<{ notifications: AppNotification[]; unreadCount: number }>('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (e) {
      console.error(e);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return user?.role === 'CONSULTANT' ? 'Compliance Command Centre' : "Today's Compliance Due";
      case 'businesses':
        return 'Client Portfolio';
      case 'client-profile':
        return 'Client Compliance Dossier';
      case 'templates':
        return 'Compliance Requirement Master Templates';
      case 'regulatory':
        return user?.role === 'CONSULTANT' ? 'Regulatory Advisory & Bulletins' : 'Regulatory Directives & Bulletins';
      case 'documents-review':
        return 'Evidence Verification Queue';
      case 'documents':
        return 'Evidence & Records Repository';
      case 'calendar':
        return 'Audit & Compliance Schedule';
      case 'audit':
        return 'System Audit Trail & History';
      case 'whats-due':
        return "What's Due";
      case 'tasks':
        return 'My Assigned Tasks';
      default:
        return currentView.replace('-', ' ');
    }
  };

  return (
    <header className="header-bar">
      {/* Left Section: Title & Context */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#191919', letterSpacing: '-0.3px', margin: 0 }}>
            {getViewTitle()}
          </h2>
          {user?.role !== 'CONSULTANT' && user?.business_name && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                backgroundColor: 'rgba(30, 58, 47, 0.08)',
                color: '#1e3a2f',
                border: '1px solid rgba(30, 58, 47, 0.15)'
              }}
            >
              <Building2 size={12} />
              {user.business_name}
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: '#555550', margin: '3px 0 0 0' }}>
          {user?.role === 'CONSULTANT' 
            ? 'Multi-tenant food safety governance, verification & regulatory operations'
            : `FSSAI and regulatory compliance records for ${user?.business_name || 'organization'}`}
        </p>
      </div>

      {/* Right Section: Persona Switcher, Notifications, User Menu, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Quick Persona Switcher Menu */}
        <div style={{ position: 'relative' }} ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#f4f4f0',
              border: '1px solid #e2e2dc',
              borderRadius: '8px',
              color: '#333330'
            }}
            title="Switch demo persona without relogging"
          >
            <RefreshCw size={13} color="#1e3a2f" />
            <span>Switch Role</span>
            <ChevronDown size={12} color="#777770" />
          </button>

          {showRoleSwitcher && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                width: '260px',
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                border: '1px solid #e2e2dc',
                zIndex: 60,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#888880', textTransform: 'uppercase' }}>
                Simulate Demo Role
              </div>
              <button
                onClick={() => { switchRole('CONSULTANT'); onNavigate('dashboard'); setShowRoleSwitcher(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: user?.role === 'CONSULTANT' ? '#eef5f1' : 'transparent',
                  color: user?.role === 'CONSULTANT' ? '#1e3a2f' : '#333',
                  fontWeight: user?.role === 'CONSULTANT' ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <ShieldCheck size={16} color="#1e3a2f" />
                <div>
                  <div>Consultant</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>Command Centre & Review</div>
                </div>
              </button>

              <button
                onClick={() => { switchRole('CLIENT'); onNavigate('whats-due'); setShowRoleSwitcher(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: user?.role === 'CLIENT' ? '#eef5f1' : 'transparent',
                  color: user?.role === 'CLIENT' ? '#1e3a2f' : '#333',
                  fontWeight: user?.role === 'CLIENT' ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Building2 size={16} color="#2b5c49" />
                <div>
                  <div>Client (Owner)</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>Shree Foods Dashboard</div>
                </div>
              </button>

              <button
                onClick={() => { switchRole('MANAGER'); onNavigate('tasks'); setShowRoleSwitcher(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: user?.role === 'MANAGER' ? '#eef5f1' : 'transparent',
                  color: user?.role === 'MANAGER' ? '#1e3a2f' : '#333',
                  fontWeight: user?.role === 'MANAGER' ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <UserCheck size={16} color="#2563eb" />
                <div>
                  <div>QA Manager</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>Daily Assigned Tasks</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="btn btn-secondary btn-sm"
            style={{
              position: 'relative',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              padding: 0,
              backgroundColor: showNotifs ? '#eef5f1' : '#f4f4f0',
              border: '1px solid #e2e2dc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#333330',
              cursor: 'pointer'
            }}
            aria-label="Notifications"
          >
            <Bell size={17} color={unreadCount > 0 ? '#1e3a2f' : '#555550'} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#c0392b',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '380px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.14)',
                border: '1px solid #e2e2dc',
                zIndex: 60,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #ededeb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8f8f5'
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#191919' }}>
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1e3a2f',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: '#777770', fontSize: '13px' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f2f2ef',
                        backgroundColor: notif.read_at ? '#ffffff' : '#f4f8f5',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#191919' }}>
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '10px', color: '#888880' }}>
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#555550', lineHeight: 1.4, margin: 0 }}>
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '4px 10px 4px 6px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #e2e2dc'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: user?.role === 'CONSULTANT' ? '#1e3a2f' : '#2b5c49',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            {user?.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#191919', lineHeight: 1.1 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '10.5px', color: '#777770' }}>
              {user?.role === 'CONSULTANT' ? 'Lead Consultant' : user?.business_name || user?.role}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e2dc',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#c0392b',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Sign out of FoodSafe"
        >
          <LogOut size={13} />
          <span>Log Out</span>
        </button>

      </div>
    </header>
  );
};
