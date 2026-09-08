import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { Business, BusinessCategory, AuditLog } from '../types';
import { 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Plus, 
  ChevronRight, 
  FileCheck2,
  Radio,
  Calendar,
  Activity
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, data?: any) => void;
  onOpenAddBusiness: () => void;
}

export const ComplianceCommandCentre: React.FC<Props> = ({ onNavigate, onOpenAddBusiness }) => {
  const [stats, setStats] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, bizData, catData, auditData] = await Promise.all([
        apiRequest('/businesses/dashboard/stats'),
        apiRequest('/businesses'),
        apiRequest('/categories'),
        apiRequest('/audit?limit=6')
      ]);

      setStats(statsData);
      setBusinesses(bizData.businesses || []);
      setCategories(catData.categories || []);
      setRecentAudits(auditData.auditLogs || []);
    } catch (e) {
      console.error('Failed to load command centre:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBusinesses = businesses.filter(b => {
    if (selectedCategory && b.business_category_id !== parseInt(selectedCategory, 10)) return false;
    if (selectedStatus && b.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = b.business_name.toLowerCase().includes(q);
      const matchCity = b.city.toLowerCase().includes(q);
      const matchCat = (b.category_name || '').toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchCat) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="badge badge-compliant">
            <span className="dot-indicator green"></span>
            Compliant
          </span>
        );
      case 'ATTENTION_REQUIRED':
        return (
          <span className="badge badge-attention">
            <span className="dot-indicator amber"></span>
            Attention Required
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="badge badge-critical">
            <span className="dot-indicator red"></span>
            Critical
          </span>
        );
      default:
        return <span className="badge badge-upcoming">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header Greeting (Specification Section 5) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#686862' }}>
            Compliance Command Centre
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#141413', marginTop: '2px', letterSpacing: '-0.4px' }}>
            Good morning, Consultant.
          </h1>
          <p style={{ fontSize: '13.5px', color: '#686862', marginTop: '2px' }}>
            Here's what needs your compliance attention today across your business portfolio.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('documents-review')}>
            <FileCheck2 size={15} />
            Review Queue
          </button>
          <button className="btn btn-primary" onClick={onOpenAddBusiness}>
            <Plus size={15} />
            Add Business
          </button>
        </div>
      </div>

      {/* 4 Primary Actionable KPI Cards (Section 5) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        <div
          className="card"
          style={{
            borderLeft: '4px solid #991b1b',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedStatus('CRITICAL')}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Critical Attention
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#991b1b', margin: '4px 0 2px' }}>
            {stats?.immediateAttention?.expiredRequirements || 8} businesses
          </div>
          <div style={{ fontSize: '12px', color: '#686862' }}>
            Expired licences or overdue testing
          </div>
        </div>

        <div
          className="card"
          style={{
            borderLeft: '4px solid #b45309',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedStatus('ATTENTION_REQUIRED')}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Attention Required
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#b45309', margin: '4px 0 2px' }}>
            {stats?.immediateAttention?.expiringWithin30Days || 24} businesses
          </div>
          <div style={{ fontSize: '12px', color: '#686862' }}>
            Expiring within 30 days
          </div>
        </div>

        <div
          className="card"
          style={{
            borderLeft: '4px solid #1e3a2f',
            cursor: 'pointer'
          }}
          onClick={() => onNavigate('documents-review')}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a2f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Awaiting Review
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e3a2f', margin: '4px 0 2px' }}>
            {stats?.immediateAttention?.awaitingReview || 12} submissions
          </div>
          <div style={{ fontSize: '12px', color: '#686862', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Client evidence waiting approval</span>
            <ChevronRight size={13} />
          </div>
        </div>

        <div
          className="card"
          style={{
            borderLeft: '4px solid #285241',
            cursor: 'pointer'
          }}
          onClick={() => onNavigate('regulatory')}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#285241', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Regulatory Updates
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#141413', margin: '4px 0 2px' }}>
            2 active broadcasts
          </div>
          <div style={{ fontSize: '12px', color: '#686862' }}>
            693 businesses targeted
          </div>
        </div>
      </div>

      {/* Middle Grid: "Needs Your Attention" List + Upcoming & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Actionable List */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Needs Your Attention Today</h2>
              <p style={{ fontSize: '12.5px', color: '#686862' }}>Priority compliance action items across client portfolio</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Shree Foods */}
            <div
              style={{
                padding: '12px 14px',
                background: '#fffdfa',
                border: '1px solid #fde68a',
                borderLeft: '4px solid #b45309',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="dot-indicator red" style={{ width: '8px', height: '8px' }}></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#141413' }}>
                    Shree Foods (Pickle Manufacturer)
                  </div>
                  <div style={{ fontSize: '12px', color: '#92400e' }}>
                    FSSAI Central / State Licence expires in 12 days
                  </div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('client-profile', { businessId: 1 })}
              >
                Review
              </button>
            </div>

            {/* Maa Papad Udyog */}
            <div
              style={{
                padding: '12px 14px',
                background: '#fbfbfa',
                border: '1px solid #e8e8e3',
                borderLeft: '4px solid #b45309',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="dot-indicator amber" style={{ width: '8px', height: '8px' }}></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#141413' }}>
                    Maa Papad Udyog (Papad Manufacturer)
                  </div>
                  <div style={{ fontSize: '12px', color: '#686862' }}>
                    Quarterly Water Testing due in 8 days
                  </div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('client-profile', { businessId: 2 })}
              >
                View
              </button>
            </div>

            {/* Annapurna Foods */}
            <div
              style={{
                padding: '12px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderLeft: '4px solid #991b1b',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="dot-indicator red" style={{ width: '8px', height: '8px' }}></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#7f1d1d' }}>
                    Annapurna Foods (Masala Manufacturer)
                  </div>
                  <div style={{ fontSize: '12px', color: '#991b1b' }}>
                    Critical: Lab Testing overdue • Evidence awaiting review
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: '#991b1b' }}
                onClick={() => onNavigate('client-profile', { businessId: 3 })}
              >
                Review
              </button>
            </div>

            {/* Green Leaf Restaurant */}
            <div
              style={{
                padding: '12px 14px',
                background: '#fbfbfa',
                border: '1px solid #e8e8e3',
                borderLeft: '4px solid #b45309',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="dot-indicator amber" style={{ width: '8px', height: '8px' }}></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#141413' }}>
                    Green Leaf Restaurant (Restaurant)
                  </div>
                  <div style={{ fontSize: '12px', color: '#686862' }}>
                    Quarterly Pest Control audit due in 8 days
                  </div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('client-profile', { businessId: 5 })}
              >
                View
              </button>
            </div>
          </div>
        </div>

        {/* Right: Upcoming Horizons & Recent Activity Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Upcoming Next 7 Days (Section 5) */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#141413' }}>
                Upcoming (Next 7 Days)
              </h3>
              <Calendar size={15} color="#686862" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f4f0' }}>
                <span style={{ color: '#4a4a46' }}>Water Potability Testing</span>
                <span style={{ fontWeight: 700, color: '#1e3a2f' }}>8 businesses</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f4f0' }}>
                <span style={{ color: '#4a4a46' }}>Statutory Licence Expiry</span>
                <span style={{ fontWeight: 700, color: '#991b1b' }}>5 businesses</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#4a4a46' }}>Pest Control Audit</span>
                <span style={{ fontWeight: 700, color: '#1e3a2f' }}>3 businesses</span>
              </div>
            </div>
          </div>

          {/* Recent Activity / Audit Stream */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#141413' }}>
                Recent Activity
              </h3>
              <Activity size={15} color="#686862" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span className="dot-indicator green" style={{ marginTop: '5px' }}></span>
                <div>
                  <div style={{ fontWeight: 600, color: '#141413' }}>Shree Foods uploaded FSSAI licence</div>
                  <div style={{ color: '#8c8c84', fontSize: '11px' }}>2 minutes ago</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span className="dot-indicator blue" style={{ marginTop: '5px' }}></span>
                <div>
                  <div style={{ fontWeight: 600, color: '#141413' }}>Maa Papad Udyog acknowledged regulatory update</div>
                  <div style={{ color: '#8c8c84', fontSize: '11px' }}>15 minutes ago</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span className="dot-indicator amber" style={{ marginTop: '5px' }}></span>
                <div>
                  <div style={{ fontWeight: 600, color: '#141413' }}>Consultant published regulatory update</div>
                  <div style={{ color: '#8c8c84', fontSize: '11px' }}>1 hour ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Risk Table (Section 6) */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="card-title">Client Risk Monitor</h2>
            <p style={{ fontSize: '12.5px', color: '#686862' }}>
              Showing {filteredBusinesses.length} active demo businesses ({stats?.portfolio?.totalBusinesses?.toLocaleString() || '2,147'} total portfolio)
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: '#8c8c84' }} />
              <input
                type="text"
                placeholder="Search business or city..."
                className="form-input"
                style={{ paddingLeft: '30px', width: '200px', height: '32px', fontSize: '12px' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '170px', height: '32px', fontSize: '12px' }}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: '150px', height: '32px', fontSize: '12px' }}
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="">All Risk States</option>
              <option value="CRITICAL">Critical</option>
              <option value="ATTENTION_REQUIRED">Attention Required</option>
              <option value="COMPLIANT">Compliant</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Attention</th>
                <th>Next Due</th>
                <th>Last Activity</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map(b => (
                <tr
                  key={b.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('client-profile', { businessId: b.id })}
                >
                  <td>
                    <div style={{ fontWeight: 700, color: '#141413' }}>{b.business_name}</div>
                    <div style={{ fontSize: '11px', color: '#686862' }}>{b.city}, {b.state}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: '#4a4a46' }}>{b.category_name}</span>
                  </td>
                  <td>{getStatusBadge(b.status)}</td>
                  <td>
                    {b.critical_issue ? (
                      <div>
                        <span style={{ fontWeight: 600, color: b.critical_issue.status === 'Overdue' ? '#991b1b' : '#b45309' }}>
                          {b.critical_issue.requirement_name}
                        </span>
                        <div style={{ fontSize: '11px', color: '#686862' }}>{b.critical_issue.status}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#166534', fontSize: '12px', fontWeight: 500 }}>None pending</span>
                    )}
                  </td>
                  <td>
                    {b.next_due_date ? (
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        {new Date(b.next_due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    ) : (
                      <span style={{ color: '#8c8c84' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '11.5px', color: '#686862' }}>
                      {b.last_activity ? new Date(b.last_activity).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recent'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('client-profile', { businessId: b.id });
                      }}
                    >
                      View
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
