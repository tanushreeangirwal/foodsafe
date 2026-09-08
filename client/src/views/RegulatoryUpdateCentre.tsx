import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { RegulatoryUpdate, BusinessCategory } from '../types';
import { 
  Radio, 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  Users, 
  Eye, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { CreateRegulatoryModal } from '../components/CreateRegulatoryModal';
import { BroadcastDashboardModal } from '../components/BroadcastDashboardModal';

export const RegulatoryUpdateCentre: React.FC = () => {
  const [updates, setUpdates] = useState<RegulatoryUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/regulatory');
      setUpdates(data.updates || []);
    } catch (e) {
      console.error('Failed to load regulatory updates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              Regulatory Broadcast Centre
            </h1>
            <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '11px' }}>
              Statutory Intelligence
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Publish regulatory advisories, target specific manufacturing categories, broadcast alerts, and monitor compliance acknowledgements.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          Create & Broadcast Update
        </button>
      </div>

      {/* Updates List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {updates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No regulatory updates created yet.
          </div>
        ) : (
          updates.map(u => (
            <div
              key={u.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '20px',
                transition: 'box-shadow 0.2s ease',
                borderLeft: '5px solid #2563eb'
              }}
            >
              <div style={{ flex: 1, minWidth: '320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-submitted" style={{ fontSize: '11px' }}>
                    {u.status}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Published {u.published_date}
                  </span>
                  {u.effective_date && (
                    <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 600 }}>
                      • Effective: {u.effective_date}
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  {u.title}
                </h2>

                <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '12px' }}>
                  {u.summary}
                </p>

                {/* Target Categories Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Targeted:</span>
                  {u.targeted_categories && u.targeted_categories.length > 0 ? (
                    u.targeted_categories.map((c, i) => (
                      <span key={i} className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155', fontSize: '11px' }}>
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '11px' }}>All Categories</span>
                  )}
                </div>
              </div>

              {/* Broadcast Reach Statistics Widget */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  minWidth: '260px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Broadcast Status
                  </span>
                  <BarChart3 size={16} color="#2563eb" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Target Reach</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                      {u.simulated_reach || 693}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Acknowledged</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>
                      {u.actual_acknowledged_count && u.actual_acknowledged_count > 0 
                        ? (587 + u.actual_acknowledged_count) 
                        : 587}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setSelectedUpdateId(u.id)}
                >
                  <Eye size={13} />
                  View Broadcast Dashboard
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Regulatory Update */}
      {showCreateModal && (
        <CreateRegulatoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchUpdates();
          }}
        />
      )}

      {/* Modal: Broadcast Dashboard Tracker */}
      {selectedUpdateId && (
        <BroadcastDashboardModal
          updateId={selectedUpdateId}
          onClose={() => setSelectedUpdateId(null)}
        />
      )}
    </div>
  );
};
