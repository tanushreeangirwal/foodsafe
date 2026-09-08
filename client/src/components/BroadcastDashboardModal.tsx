import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { X, CheckCircle2, Clock, Users, Building2, Send, Eye } from 'lucide-react';

interface Props {
  updateId: number;
  onClose: () => void;
}

export const BroadcastDashboardModal: React.FC<Props> = ({ updateId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBroadcastDetails = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/regulatory/${updateId}`);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcastDetails();
  }, [updateId]);

  if (loading || !data) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" style={{ padding: '40px', textAlign: 'center' }}>
          Loading broadcast metrics...
        </div>
      </div>
    );
  }

  const { update, broadcastStats, clients } = data;
  const ackPercentage = Math.round((broadcastStats.acknowledged / broadcastStats.totalAffected) * 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '840px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge badge-submitted" style={{ fontSize: '11px', marginBottom: '4px' }}>
              Regulatory Broadcast Tracker
            </span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              {update.title}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Top Progress Analytics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
            <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Total Affected
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {broadcastStats.totalAffected}
              </div>
              <div style={{ fontSize: '11px', color: '#059669' }}>100% Broadcasted</div>
            </div>

            <div style={{ padding: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
                Read / Viewed
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
                {broadcastStats.read}
              </div>
              <div style={{ fontSize: '11px', color: '#1d4ed8' }}>
                {Math.round((broadcastStats.read / broadcastStats.totalAffected) * 100)}% Opened
              </div>
            </div>

            <div style={{ padding: '14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
                Acknowledged
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {broadcastStats.acknowledged}
              </div>
              <div style={{ fontSize: '11px', color: '#059669' }}>{ackPercentage}% Confirmed</div>
            </div>

            <div style={{ padding: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                Pending
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                {broadcastStats.pending}
              </div>
              <div style={{ fontSize: '11px', color: '#d97706' }}>Follow-up scheduled</div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span style={{ color: '#475569' }}>Overall Compliance Acknowledgement Progress</span>
              <span style={{ color: '#059669' }}>{ackPercentage}% Acknowledged</span>
            </div>
            <div style={{ height: '10px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${ackPercentage}%`, 
                  backgroundColor: '#059669', 
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
          </div>

          {/* Client-by-client list table (Section 15 of Specification) */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
              Targeted Seeded Businesses ({clients.length})
            </h4>

            <div className="table-container" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Category</th>
                    <th>Notification Status</th>
                    <th>Acknowledgement</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c: any) => (
                    <tr key={c.client_id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.business_name}</td>
                      <td>{c.category_name}</td>
                      <td>
                        <span className="badge badge-compliant" style={{ fontSize: '11px' }}>
                          Delivered
                        </span>
                      </td>
                      <td>
                        {c.acknowledgement_status === 'ACKNOWLEDGED' ? (
                          <span className="badge badge-compliant" style={{ fontSize: '11px' }}>
                            <CheckCircle2 size={12} />
                            Acknowledged
                          </span>
                        ) : (
                          <span className="badge badge-attention" style={{ fontSize: '11px' }}>
                            <Clock size={12} />
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {c.acknowledged_at ? new Date(c.acknowledged_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
