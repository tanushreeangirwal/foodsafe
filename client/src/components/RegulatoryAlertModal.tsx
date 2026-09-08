import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { RegulatoryUpdate } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Radio, AlertCircle, CheckCircle2, X, ExternalLink } from 'lucide-react';

interface Props {
  onAcknowledged?: () => void;
}

export const RegulatoryAlertModal: React.FC<Props> = ({ onAcknowledged }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [unacknowledgedUpdate, setUnacknowledgedUpdate] = useState<RegulatoryUpdate | null>(null);
  const [showFullDirective, setShowFullDirective] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only check for Client role
    if (user?.role === 'CLIENT' || user?.role === 'MANAGER') {
      const checkPendingUpdates = async () => {
        try {
          const data = await apiRequest('/regulatory');
          const pending = (data.updates || []).find((u: RegulatoryUpdate) => u.acknowledgement_status === 'PENDING');
          if (pending) {
            setUnacknowledgedUpdate(pending);
          }
        } catch (e) {
          console.error('Failed to check regulatory alerts:', e);
        }
      };
      checkPendingUpdates();
    }
  }, [user]);

  if (!unacknowledgedUpdate) return null;

  const handleAcknowledge = async () => {
    try {
      setLoading(true);
      await apiRequest(`/regulatory/${unacknowledgedUpdate.id}/acknowledge`, {
        method: 'POST'
      });
      showToast(
        'Regulatory Update Acknowledged',
        'Compliance acknowledgement recorded in database and broadcast ledger.',
        'success'
      );
      setUnacknowledgedUpdate(null);
      if (onAcknowledged) onAcknowledged();
    } catch (e: any) {
      console.error(e);
      showToast('Error', e.message || 'Failed to acknowledge update', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 999 }}>
      <div className="modal-card" style={{ maxWidth: '560px', borderLeft: '6px solid #b45309' }}>
        <div className="modal-header" style={{ background: '#fffdfa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="badge"
              style={{
                backgroundColor: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <Radio size={12} />
              NEW REGULATORY DIRECTIVE
            </span>
          </div>
          <button
            onClick={() => setUnacknowledgedUpdate(null)}
            style={{ background: 'none', border: 'none', color: '#8c8c84', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#141413', marginBottom: '8px', lineHeight: 1.3 }}>
            {unacknowledgedUpdate.title}
          </h2>

          <p style={{ fontSize: '13.5px', color: '#4a4a46', lineHeight: 1.5, marginBottom: '14px' }}>
            {unacknowledgedUpdate.summary}
          </p>

          <div
            style={{
              padding: '14px',
              background: '#fbfbfa',
              border: '1px solid #e8e8e3',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          >
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e3a2f', textTransform: 'uppercase', marginBottom: '4px' }}>
              What this means for your business:
            </div>
            <p style={{ fontSize: '13px', color: '#363634', lineHeight: 1.4 }}>
              {unacknowledgedUpdate.description || 'Mandatory testing parameter update. Please review applicable batch recipes and testing documentation.'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#686862' }}>
            <span>Source: <strong>{unacknowledgedUpdate.source}</strong></span>
            <span>Effective: <strong>{unacknowledgedUpdate.effective_date || 'Immediate'}</strong></span>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setUnacknowledgedUpdate(null)}
          >
            Remind Me Later
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ background: '#1e3a2f' }}
            disabled={loading}
            onClick={handleAcknowledge}
          >
            <CheckCircle2 size={15} />
            {loading ? 'Recording...' : 'Acknowledge Update'}
          </button>
        </div>
      </div>
    </div>
  );
};
