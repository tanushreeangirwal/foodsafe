import React, { useState } from 'react';
import { EvidenceDocument } from '../types';
import { apiRequest } from '../api';
import { X, CheckCircle2, XCircle, ExternalLink, AlertCircle, FileText } from 'lucide-react';

interface Props {
  document: EvidenceDocument | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EvidenceReviewModal: React.FC<Props> = ({ document, onClose, onSuccess }) => {
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!document) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiRequest(`/evidence/${document.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          review_status: 'APPROVED',
          reviewer_notes: notes.trim() || 'Verified and approved by consultant.'
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to approve evidence');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      setError('A mandatory rejection reason must be provided so the client knows what to correct.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiRequest(`/evidence/${document.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          review_status: 'REJECTED',
          reviewer_notes: notes.trim()
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to reject evidence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11px', marginBottom: '4px' }}>
              Consultant Review
            </span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Review Evidence Document
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Document metadata card */}
          <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                {document.business_name || 'Client Business'}
              </div>
              <span className="badge badge-submitted">Awaiting Review</span>
            </div>

            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
              Requirement: <strong>{document.requirement_name || 'Compliance Item'}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#2563eb" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                    {document.file_name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Uploaded {new Date(document.uploaded_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <a
                href={document.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={13} />
                Open Document
              </a>
            </div>
          </div>

          {/* Decision Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Review Decision</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${decision === 'APPROVE' ? 'btn-success' : 'btn-secondary'}`}
                style={{ padding: '12px', height: 'auto', justifyContent: 'center' }}
                onClick={() => { setDecision('APPROVE'); setError(null); }}
              >
                <CheckCircle2 size={16} />
                Approve Evidence
              </button>

              <button
                type="button"
                className={`btn ${decision === 'REJECT' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ padding: '12px', height: 'auto', justifyContent: 'center' }}
                onClick={() => { setDecision('REJECT'); setError(null); }}
              >
                <XCircle size={16} />
                Reject Evidence
              </button>
            </div>
          </div>

          {/* Notes field */}
          <div className="form-group">
            <label className="form-label">
              {decision === 'REJECT' ? (
                <span style={{ color: '#dc2626' }}>* Rejection Reason (Mandatory for client):</span>
              ) : (
                'Review Notes / Remarks (Optional):'
              )}
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={decision === 'REJECT' 
                ? 'e.g. Document is expired. Please upload the renewed certificate.' 
                : 'e.g. Verified license expiry and validity.'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          {decision === 'APPROVE' && (
            <button type="button" className="btn btn-success" onClick={handleApprove} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Approval'}
            </button>
          )}
          {decision === 'REJECT' && (
            <button type="button" className="btn btn-danger" onClick={handleReject} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Rejection'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
