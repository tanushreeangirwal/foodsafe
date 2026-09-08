import React, { useState } from 'react';
import { ClientRequirement } from '../types';
import { getAuthToken } from '../api';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  requirement: ClientRequirement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EvidenceUploadModal: React.FC<Props> = ({ requirement, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!requirement) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload (PDF, JPG, or PNG).');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('evidence', file);
      formData.append('client_requirement_id', requirement.id.toString());
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const token = getAuthToken();
      const res = await fetch('/api/evidence/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || 'Failed to upload evidence');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11px', marginBottom: '4px' }}>
              Evidence Submission
            </span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Upload Compliance Document
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Requirement Context Box */}
            <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '18px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14.5px' }}>
                {requirement.custom_name || requirement.template_name}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12.5px', color: '#64748b' }}>
                <span>Due: <strong>{requirement.due_date}</strong></span>
                <span>Required format: <strong>{requirement.evidence_type || 'PDF, JPG, PNG'}</strong></span>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Dropzone */}
            <div className="form-group">
              <label className="form-label">Select File (PDF, JPG, PNG up to 25MB)</label>
              <label className="upload-dropzone" style={{ display: 'block' }}>
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <UploadCloud size={36} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
                {file ? (
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {(file.size / 1024).toFixed(1)} KB • Click to choose another file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13.5px' }}>
                      Click to browse or drop compliance document here
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                      Official certificates, lab reports, calibration sheets, licenses
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Submission Notes / Certificate Details (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Renewed license valid till Dec 2027, issued by State Authority."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Submit Evidence for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
