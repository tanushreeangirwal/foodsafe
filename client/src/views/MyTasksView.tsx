import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { ClientRequirement, RegulatoryUpdate } from '../types';
import { CheckSquare, Clock, AlertCircle, CheckCircle2, UploadCloud, Radio, ExternalLink } from 'lucide-react';

interface Props {
  onOpenUpload: (req: ClientRequirement) => void;
  onOpenRegulatory?: () => void;
}

export const MyTasksView: React.FC<Props> = ({ onOpenUpload, onOpenRegulatory }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<ClientRequirement[]>([]);
  const [pendingUpdate, setPendingUpdate] = useState<RegulatoryUpdate | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const [reqData, regData] = await Promise.all([
        apiRequest('/requirements'),
        apiRequest('/regulatory')
      ]);

      // Focus on items requiring action
      const pendingReqs = (reqData.requirements || []).filter((r: ClientRequirement) => r.status !== 'Approved');
      setRequirements(pendingReqs);

      const unackUpdate = (regData.updates || []).find((u: RegulatoryUpdate) => u.acknowledgement_status === 'PENDING');
      setPendingUpdate(unackUpdate || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#141413' }}>
            My Facility Tasks & Actions
          </h1>
          <span className="badge badge-attention">
            {user?.business_name || 'Shree Foods'}
          </span>
        </div>
        <p style={{ fontSize: '13.5px', color: '#686862', marginTop: '4px' }}>
          Assigned compliance actions, routine testing requirements, and regulatory acknowledgements.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Pending Regulatory Directive task if any */}
        {pendingUpdate && (
          <div
            className="card"
            style={{
              borderLeft: '5px solid #b45309',
              background: '#fffdfa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 20px',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ padding: '8px', background: '#fffbeb', borderRadius: '8px', color: '#b45309' }}>
                <Radio size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#141413' }}>
                    Acknowledge Regulatory Directive
                  </h3>
                  <span className="badge badge-attention">Immediate</span>
                </div>
                <div style={{ fontSize: '13px', color: '#4a4a46', marginTop: '3px' }}>
                  {pendingUpdate.title}
                </div>
              </div>
            </div>

            {onOpenRegulatory && (
              <button className="btn btn-primary btn-sm" onClick={onOpenRegulatory}>
                Review Directive
              </button>
            )}
          </div>
        )}

        {/* Requirements tasks */}
        {requirements.length === 0 && !pendingUpdate ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#686862' }}>
            <div style={{ width: '42px', height: '42px', background: '#f0fdf4', borderRadius: '50%', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#141413' }}>
              You're all caught up!
            </h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              No pending compliance tasks or overdue reports for your facility.
            </p>
          </div>
        ) : (
          requirements.map(req => {
            const isCritical = req.priority === 'CRITICAL' || req.status === 'Overdue';
            return (
              <div
                key={req.id}
                className="card"
                style={{
                  borderLeft: isCritical ? '5px solid #991b1b' : '5px solid #b45309',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 20px',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      padding: '8px',
                      background: isCritical ? '#fef2f2' : '#fffbeb',
                      borderRadius: '8px',
                      color: isCritical ? '#991b1b' : '#b45309'
                    }}
                  >
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#141413' }}>
                        {req.custom_name || req.template_name}
                      </h3>
                      <span className="badge" style={{ backgroundColor: isCritical ? '#fef2f2' : '#fffbeb', color: isCritical ? '#991b1b' : '#b45309', fontSize: '11px' }}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#686862', marginTop: '4px' }}>
                      Due by: <strong>{new Date(req.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      {req.expiry_date && (
                        <span style={{ marginLeft: '8px' }}>
                          • Expiry: {new Date(req.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onOpenUpload(req)}
                >
                  <UploadCloud size={14} />
                  Complete & Upload
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
