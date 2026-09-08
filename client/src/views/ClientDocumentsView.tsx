import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { ClientRequirement, EvidenceDocument } from '../types';
import { FileText, ExternalLink, UploadCloud, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface Props {
  onOpenUpload?: (req: ClientRequirement) => void;
}

export const ClientDocumentsView: React.FC<Props> = ({ onOpenUpload }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<ClientRequirement[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [user]);

  const allDocs: { doc: EvidenceDocument; req: ClientRequirement }[] = [];
  requirements.forEach(r => {
    if (r.documents && r.documents.length > 0) {
      r.documents.forEach(d => allDocs.push({ doc: d, req: r }));
    }
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
          Compliance Documents & Submitted Evidence
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Official records, laboratory test reports, certificates, and inspection approvals for {user?.business_name || 'My Business'}.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Document Repository ({allDocs.length})</h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document File</th>
                <th>Requirement</th>
                <th>Upload Date</th>
                <th>Review Status</th>
                <th>Consultant Remarks</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No documents uploaded yet. Go to "What's Due" to upload required certificates and test reports.
                  </td>
                </tr>
              ) : (
                allDocs.map(({ doc, req }) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#2563eb" />
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{doc.file_name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.file_type}</div>
                        </div>
                      </div>
                    </td>
                    <td>{req.custom_name || req.template_name}</td>
                    <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td>
                      {doc.review_status === 'APPROVED' && (
                        <span className="badge badge-compliant">
                          <CheckCircle2 size={12} />
                          Approved
                        </span>
                      )}
                      {doc.review_status === 'PENDING' && (
                        <span className="badge badge-submitted">
                          <Clock size={12} />
                          Under Review
                        </span>
                      )}
                      {doc.review_status === 'REJECTED' && (
                        <span className="badge badge-critical">
                          <XCircle size={12} />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td>
                      {doc.reviewer_notes ? (
                        <span style={{ fontSize: '12.5px', color: doc.review_status === 'REJECTED' ? '#dc2626' : '#475569' }}>
                          {doc.reviewer_notes}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <ExternalLink size={12} />
                          Download
                        </a>
                        {doc.review_status === 'REJECTED' && onOpenUpload && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onOpenUpload(req)}
                          >
                            <UploadCloud size={12} />
                            Re-upload
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
