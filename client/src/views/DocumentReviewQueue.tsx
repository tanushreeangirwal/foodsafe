import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { EvidenceDocument } from '../types';
import { FileCheck2, ExternalLink, CheckCircle2, XCircle, Building2, Calendar } from 'lucide-react';
import { EvidenceReviewModal } from '../components/EvidenceReviewModal';

export const DocumentReviewQueue: React.FC = () => {
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<EvidenceDocument | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/evidence/pending');
      setDocuments(data.pendingDocuments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
          Evidence Review Queue
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Inspect submitted compliance documents, certificates, and test reports awaiting consultant approval.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Pending Submissions ({documents.length})</h2>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            Requires consultant verification
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Requirement</th>
                <th>Document Submitted</th>
                <th>Uploaded By</th>
                <th>Submission Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>
                      All submissions reviewed!
                    </div>
                    <p style={{ fontSize: '12.5px', marginTop: '4px' }}>
                      There are no pending documents in the queue at this time.
                    </p>
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {doc.business_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {doc.category_name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {doc.requirement_name}
                      </div>
                      <div style={{ fontSize: '11px', color: doc.priority === 'CRITICAL' ? '#dc2626' : '#64748b' }}>
                        Due: {doc.due_date} ({doc.priority})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2563eb' }}>
                        {doc.file_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Document'}
                      </div>
                    </td>
                    <td>{doc.uploader_name || 'Client User'}</td>
                    <td>{new Date(doc.uploaded_at).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <ExternalLink size={12} />
                          View
                        </a>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          Review Decision
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoc && (
        <EvidenceReviewModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onSuccess={() => {
            fetchQueue();
          }}
        />
      )}
    </div>
  );
};
