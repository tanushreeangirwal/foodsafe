import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { RegulatoryUpdate } from '../types';
import { Radio, CheckCircle2, Clock, ExternalLink, AlertCircle, ShieldAlert } from 'lucide-react';

export const ClientRegulatoryView: React.FC = () => {
  const [updates, setUpdates] = useState<RegulatoryUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/regulatory');
      setUpdates(data.updates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleAcknowledge = async (updateId: number) => {
    try {
      setAcknowledgingId(updateId);
      await apiRequest(`/regulatory/${updateId}/acknowledge`, { method: 'POST' });
      await fetchUpdates();
    } catch (e) {
      console.error('Failed to acknowledge update:', e);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            Regulatory Updates & Compliance Bulletins
          </h1>
          <span className="badge badge-submitted">Applicable Directives</span>
        </div>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Review food safety statutory advisories, circulars, and mandatory actions applicable to your business category.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {updates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No regulatory notices published for your category at this time.
          </div>
        ) : (
          updates.map(u => {
            const isAcknowledged = u.acknowledgement_status === 'ACKNOWLEDGED';

            return (
              <div
                key={u.id}
                className="card"
                style={{
                  borderLeft: isAcknowledged ? '6px solid #10b981' : '6px solid #f59e0b',
                  background: isAcknowledged ? '#ffffff' : '#fffdfa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '11px' }}>
                        DEMO REGULATORY UPDATE
                      </span>
                      {isAcknowledged ? (
                        <span className="badge badge-compliant">
                          <CheckCircle2 size={13} />
                          Acknowledged
                        </span>
                      ) : (
                        <span className="badge badge-attention">
                          <Clock size={13} />
                          Action Required: Acknowledgment Pending
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                      {u.title}
                    </h2>

                    <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '12px' }}>
                      {u.summary}
                    </p>

                    {/* What this means for your business box (Specification Section 14) */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                        What this means for your business:
                      </h4>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                        {u.description || 'Review batch testing records and ensure compliance with specified additive and ingredient limits.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: '#64748b' }}>
                      <span>Published: <strong>{u.published_date}</strong></span>
                      {u.effective_date && (
                        <span>Effective Date: <strong>{u.effective_date}</strong></span>
                      )}
                      <span>Source: <strong>{u.source}</strong></span>
                    </div>
                  </div>

                  {/* Acknowledge Button */}
                  <div>
                    {isAcknowledged ? (
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-compliant" style={{ fontSize: '13px', padding: '8px 16px' }}>
                          <CheckCircle2 size={16} />
                          Acknowledged
                        </span>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                          Recorded on compliance ledger
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '10px 20px', fontSize: '14px' }}
                        disabled={acknowledgingId === u.id}
                        onClick={() => handleAcknowledge(u.id)}
                      >
                        <CheckCircle2 size={16} />
                        {acknowledgingId === u.id ? 'Recording...' : 'Acknowledge Update'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
