import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { Business, ClientRequirement, RegulatoryUpdate, EvidenceDocument, AuditLog } from '../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  ChevronLeft, 
  ExternalLink,
  Plus
} from 'lucide-react';

interface Props {
  businessId: number;
  onBack: () => void;
  onOpenUpload: (requirement: ClientRequirement) => void;
  onOpenReviewModal?: (doc: EvidenceDocument, requirement: ClientRequirement) => void;
}

export const ClientComplianceProfile: React.FC<Props> = ({ 
  businessId, 
  onBack, 
  onOpenUpload,
  onOpenReviewModal
}) => {
  const [profile, setProfile] = useState<{
    business: Business;
    requirements: ClientRequirement[];
    regulatoryUpdates: RegulatoryUpdate[];
    notifications: any[];
    activityTrail: AuditLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'requirements' | 'regulatory' | 'documents' | 'history'>('requirements');
  const [selectedReq, setSelectedReq] = useState<ClientRequirement | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/businesses/${businessId}`);
      setProfile(data);
      if (data.requirements && data.requirements.length > 0) {
        setSelectedReq(data.requirements[0]);
      }
    } catch (e) {
      console.error('Failed to load client profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [businessId]);

  if (loading || !profile) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Loading compliance profile...
      </div>
    );
  }

  const { business, requirements, regulatoryUpdates, activityTrail } = profile;

  // Flatten all documents for the documents tab
  const allDocuments: { doc: EvidenceDocument; req: ClientRequirement }[] = [];
  requirements.forEach(r => {
    if (r.documents && r.documents.length > 0) {
      r.documents.forEach(d => allDocuments.push({ doc: d, req: r }));
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="badge badge-compliant"><span className="dot-indicator green"></span>Approved</span>;
      case 'Submitted':
      case 'Under Review':
        return <span className="badge badge-submitted"><span className="dot-indicator blue"></span>{status}</span>;
      case 'Due Soon':
        return <span className="badge badge-attention"><span className="dot-indicator amber"></span>Due Soon</span>;
      case 'Due':
        return <span className="badge badge-attention"><span className="dot-indicator amber"></span>Due</span>;
      case 'Overdue':
      case 'Expired':
      case 'Rejected':
        return <span className="badge badge-critical"><span className="dot-indicator red"></span>{status}</span>;
      default:
        return <span className="badge badge-upcoming">{status}</span>;
    }
  };

  return (
    <div>
      {/* Back button */}
      <button 
        onClick={onBack}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '16px' }}
      >
        <ChevronLeft size={14} />
        Back to Businesses
      </button>

      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                {business.business_name}
              </h1>
              <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                {business.category_name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '8px', color: '#64748b', fontSize: '13px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} />
                {business.city}, {business.state} ({business.address})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={14} />
                Contact: {business.contact_person}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={14} />
                {business.phone}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={14} />
                {business.email}
              </span>
            </div>
          </div>

          {/* Compliance Status Card */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Compliance Health
            </div>
            <div style={{ marginTop: '4px' }}>
              {business.status === 'COMPLIANT' && (
                <span className="badge badge-compliant" style={{ fontSize: '14px', padding: '6px 14px' }}>
                  <CheckCircle2 size={16} />
                  COMPLIANT
                </span>
              )}
              {business.status === 'ATTENTION_REQUIRED' && (
                <span className="badge badge-attention" style={{ fontSize: '14px', padding: '6px 14px' }}>
                  <AlertCircle size={16} />
                  ATTENTION REQUIRED
                </span>
              )}
              {business.status === 'CRITICAL' && (
                <span className="badge badge-critical" style={{ fontSize: '14px', padding: '6px 14px' }}>
                  <AlertCircle size={16} />
                  CRITICAL
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', marginTop: '20px', paddingTop: '14px' }}>
          <button
            className={`btn btn-sm ${selectedTab === 'requirements' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('requirements')}
          >
            Requirements ({requirements.length})
          </button>
          <button
            className={`btn btn-sm ${selectedTab === 'regulatory' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('regulatory')}
          >
            Regulatory Updates ({regulatoryUpdates.length})
          </button>
          <button
            className={`btn btn-sm ${selectedTab === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('documents')}
          >
            Documents ({allDocuments.length})
          </button>
          <button
            className={`btn btn-sm ${selectedTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('history')}
          >
            Audit Trail ({activityTrail.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Requirements Breakdown */}
      {selectedTab === 'requirements' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Left Column: Requirements List */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Assigned Compliance Requirements</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Sorted by urgency
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {requirements.map(req => {
                const isSelected = selectedReq?.id === req.id;
                const hasDoc = req.documents && req.documents.length > 0;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          {req.custom_name || req.template_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          Type: {req.requirement_type} • Frequency: {req.frequency}
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12.5px' }}>
                      <span style={{ color: req.status === 'Overdue' ? '#dc2626' : '#475569' }}>
                        <strong>Due:</strong> {new Date(req.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {req.expiry_date && (
                          <span style={{ marginLeft: '8px', color: '#64748b' }}>
                            (Expires: {new Date(req.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})
                          </span>
                        )}
                      </span>

                      <span style={{ fontSize: '11.5px', color: hasDoc ? '#059669' : '#d97706', fontWeight: 600 }}>
                        {hasDoc ? `Evidence: ${req.documents![0].file_name}` : 'Evidence: Not submitted'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Requirement Detail (Specification Step 3) */}
          {selectedReq ? (
            <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '90px' }}>
              <div className="card-header">
                <div>
                  <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', marginBottom: '6px' }}>
                    Requirement Details
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedReq.custom_name || selectedReq.template_name}
                  </h3>
                </div>
                {getStatusBadge(selectedReq.status)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11.5px' }}>Due Date:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedReq.due_date}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11.5px' }}>Expiry Date:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedReq.expiry_date || 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11.5px' }}>Priority:</span>
                      <div style={{ fontWeight: 700, color: selectedReq.priority === 'CRITICAL' ? '#dc2626' : '#0f172a' }}>
                        {selectedReq.priority}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11.5px' }}>Evidence Type:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedReq.evidence_type || 'PDF'}</div>
                    </div>
                  </div>
                </div>

                {/* Consultant Notes */}
                <div>
                  <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Consultant Advisory Notes
                  </h4>
                  <p style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 12px', borderRadius: '6px', color: '#92400e', fontSize: '12.5px', lineHeight: 1.4 }}>
                    {selectedReq.consultant_notes || 'No consultant notes attached.'}
                  </p>
                </div>

                {/* Uploaded Evidence Documents */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Uploaded Evidence ({selectedReq.documents?.length || 0})
                    </h4>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => onOpenUpload(selectedReq)}
                    >
                      <UploadCloud size={13} />
                      Upload File
                    </button>
                  </div>

                  {(!selectedReq.documents || selectedReq.documents.length === 0) ? (
                    <div style={{ padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                      No evidence document submitted yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedReq.documents.map(doc => (
                        <div
                          key={doc.id}
                          style={{
                            padding: '10px 12px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <FileText size={16} color="#2563eb" />
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a' }}>
                                {doc.file_name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {doc.review_status} • {new Date(doc.uploaded_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px' }}
                            >
                              <ExternalLink size={12} />
                              View
                            </a>
                            {doc.review_status === 'PENDING' && onOpenReviewModal && (
                              <button 
                                className="btn btn-success btn-sm"
                                style={{ padding: '4px 8px' }}
                                onClick={() => onOpenReviewModal(doc, selectedReq)}
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: Regulatory Updates */}
      {selectedTab === 'regulatory' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Regulatory Updates Targeted to this Business</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {regulatoryUpdates.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                No regulatory notifications targeted to this client category yet.
              </div>
            ) : (
              regulatoryUpdates.map(u => (
                <div key={u.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fafbfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{u.title}</h3>
                      <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{u.summary}</p>
                    </div>
                    {u.acknowledgement_status === 'ACKNOWLEDGED' ? (
                      <span className="badge badge-compliant">
                        <CheckCircle2 size={13} />
                        Acknowledged
                      </span>
                    ) : (
                      <span className="badge badge-attention">
                        <Clock size={13} />
                        Pending Acknowledgment
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px' }}>
                    <span>Published: {u.published_date}</span>
                    <span>Effective: {u.effective_date || 'Immediate'}</span>
                    <span>Source: {u.source}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Documents Archive */}
      {selectedTab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Uploaded Evidence Documents</h2>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Requirement</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Reviewer Notes</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {allDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No documents uploaded.
                  </td>
                </tr>
              ) : (
                allDocuments.map(({ doc, req }) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{doc.file_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.file_type}</div>
                    </td>
                    <td>{req.custom_name || req.template_name}</td>
                    <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td>
                      {doc.review_status === 'APPROVED' && <span className="badge badge-compliant">Approved</span>}
                      {doc.review_status === 'PENDING' && <span className="badge badge-submitted">Pending Review</span>}
                      {doc.review_status === 'REJECTED' && <span className="badge badge-critical">Rejected</span>}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>{doc.reviewer_notes || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        <ExternalLink size={13} />
                        View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Audit Trail */}
      {selectedTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Activity Trail & Audit Records</h2>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {activityTrail.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a' }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{log.user_name || 'System'}</td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
