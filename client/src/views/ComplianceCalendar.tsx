import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { ClientRequirement } from '../types';
import { Calendar, Filter, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  onSelectBusiness?: (id: number) => void;
}

export const ComplianceCalendar: React.FC<Props> = ({ onSelectBusiness }) => {
  const [requirements, setRequirements] = useState<ClientRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/requirements');
        setRequirements(data.requirements || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Group by due month/week
  const filtered = requirements.filter(r => {
    if (filterCategory && r.category_name !== filterCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(requirements.map(r => r.category_name).filter(Boolean)));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            Compliance Deadlines & Audit Schedule
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Chronological compliance timeline of upcoming license renewals, lab testing intervals, and pest audits.
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: '200px', height: '36px' }}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c, i) => (
              <option key={i} value={c as string}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar / Timeline Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(req => {
          const isOverdue = req.status === 'Overdue' || req.status === 'Expired';
          const isApproved = req.status === 'Approved';

          return (
            <div
              key={req.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderLeft: isOverdue ? '5px solid #dc2626' : isApproved ? '5px solid #059669' : '5px solid #3b82f6',
                cursor: onSelectBusiness ? 'pointer' : 'default'
              }}
              onClick={() => onSelectBusiness && onSelectBusiness(req.client_id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Date block */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    textAlign: 'center',
                    minWidth: '70px'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {new Date(req.due_date).toLocaleDateString('en-GB', { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    {new Date(req.due_date).toLocaleDateString('en-GB', { day: '2-digit' })}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      {req.custom_name || req.template_name}
                    </h3>
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px' }}>
                      {req.category_name}
                    </span>
                    {req.priority === 'CRITICAL' && (
                      <span className="badge badge-critical" style={{ fontSize: '10.5px' }}>Critical</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                    Business: <strong>{req.business_name}</strong> • Frequency: {req.frequency}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {isApproved ? (
                  <span className="badge badge-compliant">
                    <CheckCircle2 size={13} />
                    Verified & Current
                  </span>
                ) : isOverdue ? (
                  <span className="badge badge-critical">
                    <AlertCircle size={13} />
                    Overdue
                  </span>
                ) : (
                  <span className="badge badge-attention">
                    <Clock size={13} />
                    Due Soon
                  </span>
                )}

                {onSelectBusiness && (
                  <ChevronRight size={16} color="#94a3b8" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
