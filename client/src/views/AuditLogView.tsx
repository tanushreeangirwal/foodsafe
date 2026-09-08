import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { AuditLog } from '../types';
import { History, Search, ShieldCheck, UserCheck } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/audit?limit=100');
      setLogs(data.auditLogs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.user_name || '').toLowerCase().includes(q) ||
      (l.entity_type || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            System Audit Trail & Compliance Governance
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Immutable chronological logging of all compliance state changes, evidence uploads, approvals, and regulatory broadcasts.
          </p>
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="Filter audit actions or users..."
          style={{ width: '260px' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Audit Ledger ({filtered.length} entries)</h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action Taken</th>
                <th>Actor</th>
                <th>Target Entity</th>
                <th>Metadata / Event Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-submitted" style={{ fontSize: '11px' }}>
                      {l.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {l.user_name || 'Automated Engine'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {l.user_role || 'SYSTEM'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: '#334155' }}>
                      {l.entity_type} #{l.entity_id}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#475569', maxWidth: '340px' }}>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: '#f8fafc', padding: '2px 4px', borderRadius: '4px' }}>
                      {l.metadata ? JSON.stringify(l.metadata) : '—'}
                    </code>
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
