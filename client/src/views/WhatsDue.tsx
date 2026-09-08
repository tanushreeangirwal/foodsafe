import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { ClientRequirement } from '../types';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  UploadCloud, 
  FileText, 
  ExternalLink,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface Props {
  onOpenUpload: (requirement: ClientRequirement) => void;
  onNavigate?: (view: string) => void;
}

export const WhatsDue: React.FC<Props> = ({ onOpenUpload, onNavigate }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<ClientRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/requirements');
      setRequirements(data.requirements || []);
    } catch (e) {
      console.error('Failed to fetch requirements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [user]);

  // Group into: Needs Action, Upcoming, Completed (Specification Section 8)
  const needsAction = requirements.filter(r => 
    r.status === 'Overdue' || 
    r.status === 'Expired' || 
    r.status === 'Due Soon' || 
    r.status === 'Due' ||
    (r.priority === 'CRITICAL' && r.status !== 'Approved')
  );

  const upcoming = requirements.filter(r => 
    r.status === 'Upcoming' || r.status === 'Submitted' || r.status === 'Under Review'
  );

  const completed = requirements.filter(r => r.status === 'Approved');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#141413' }}>
            What's Due
          </h1>
          <span className="badge badge-attention">
            {user?.business_name || 'Shree Foods'}
          </span>
        </div>
        <p style={{ fontSize: '13.5px', color: '#686862', marginTop: '2px' }}>
          Here's what needs your compliance attention today.
        </p>
      </div>

      {/* SECTION 1: 🔴 NEEDS ACTION */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="dot-indicator red" style={{ width: '8px', height: '8px' }}></span>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Needs Action ({needsAction.length})
          </h2>
        </div>

        {needsAction.length === 0 ? (
          <div className="card" style={{ padding: '20px', background: '#fcfdfc', color: '#166534', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>No urgent compliance actions required at this moment.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {needsAction.map(req => {
              const hasDoc = req.documents && req.documents.length > 0;
              return (
                <div
                  key={req.id}
                  className="card"
                  style={{
                    borderLeft: '5px solid #991b1b',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                    <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '8px', color: '#991b1b', marginTop: '2px' }}>
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#141413' }}>
                          {req.custom_name || req.template_name}
                        </h3>
                        <span className="badge badge-critical">
                          {req.status}
                        </span>
                        {req.priority === 'CRITICAL' && (
                          <span className="badge badge-critical" style={{ fontSize: '10px' }}>Critical</span>
                        )}
                      </div>

                      <div style={{ fontSize: '13px', color: '#4a4a46', marginTop: '4px' }}>
                        {req.expiry_date ? (
                          <span style={{ color: '#991b1b', fontWeight: 700 }}>
                            Expires in {Math.ceil((new Date(req.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days ({new Date(req.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})
                          </span>
                        ) : (
                          <span>Due date: {new Date(req.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                        )}
                        <span style={{ marginLeft: '8px', color: '#686862' }}>• Format: {req.evidence_type || 'PDF'}</span>
                      </div>

                      {req.consultant_notes && (
                        <div style={{ fontSize: '12px', color: '#686862', marginTop: '6px', background: '#fbfbfa', padding: '4px 8px', borderRadius: '4px' }}>
                          Note: {req.consultant_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenUpload(req)}
                  >
                    <UploadCloud size={14} />
                    Upload Evidence
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: 🟠 UPCOMING */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="dot-indicator amber" style={{ width: '8px', height: '8px' }}></span>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Upcoming ({upcoming.length})
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {upcoming.map(req => {
            const isReview = req.status === 'Submitted' || req.status === 'Under Review';
            return (
              <div
                key={req.id}
                className="card"
                style={{
                  borderLeft: isReview ? '5px solid #1e3a2f' : '5px solid #b45309',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ padding: '8px', background: isReview ? '#f0f7f4' : '#fffbeb', borderRadius: '8px', color: isReview ? '#1e3a2f' : '#b45309', marginTop: '2px' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#141413' }}>
                        {req.custom_name || req.template_name}
                      </h3>
                      <span className="badge" style={{ backgroundColor: isReview ? '#f0f7f4' : '#fffbeb', color: isReview ? '#1e3a2f' : '#b45309' }}>
                        {req.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#686862', marginTop: '4px' }}>
                      Due on: <strong>{new Date(req.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      {isReview && (
                        <span style={{ marginLeft: '8px', color: '#1e3a2f', fontWeight: 600 }}>
                          • Evidence submitted for consultant review
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenUpload(req)}
                >
                  <UploadCloud size={13} />
                  {isReview ? 'Update File' : 'Submit Early'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: 🟢 COMPLETED */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span className="dot-indicator green" style={{ width: '8px', height: '8px' }}></span>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#14532d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Completed & Verified ({completed.length})
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {completed.map(req => (
            <div
              key={req.id}
              className="card"
              style={{
                borderLeft: '5px solid #166534',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                gap: '16px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ color: '#166534' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#141413' }}>
                      {req.custom_name || req.template_name}
                    </h3>
                    <span className="badge badge-compliant">
                      Approved
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#686862', marginTop: '2px' }}>
                    Next due: {new Date(req.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {req.documents && req.documents.length > 0 && (
                      <span style={{ marginLeft: '8px', color: '#1e3a2f' }}>
                        • Certificate: {req.documents[0].file_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {req.documents && req.documents.length > 0 && (
                <a
                  href={req.documents[0].file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={12} />
                  View Certificate
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
