import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { RequirementTemplate, BusinessCategory } from '../types';
import { Layers, Plus, X, CheckSquare, Square, AlertCircle, Clock } from 'lucide-react';

export const RequirementTemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<RequirementTemplate[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State for new template (Specification Section 8 & Demo Steps 12-14)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [reqType, setReqType] = useState('STATUTORY');
  const [frequency, setFrequency] = useState('ANNUAL');
  const [evidenceType, setEvidenceType] = useState('PDF / Certificate');
  const [reminders, setReminders] = useState('30, 15, 7');
  const [durationDays, setDurationDays] = useState(365);
  const [priority, setPriority] = useState('HIGH');
  const [assignExisting, setAssignExisting] = useState(true); // Default true for demo flow!
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tData, cData] = await Promise.all([
        apiRequest('/templates'),
        apiRequest('/categories')
      ]);
      setTemplates(tData.templates || []);
      setCategories(cData.categories || []);
      if (cData.categories && cData.categories.length > 0) {
        setCategoryId(cData.categories[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) {
      setError('Template name and category are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const reminderArray = reminders
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n));

      await apiRequest('/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category_id: parseInt(categoryId, 10),
          requirement_type: reqType,
          frequency,
          evidence_type: evidenceType,
          reminder_schedule: reminderArray,
          default_duration_days: durationDays,
          default_priority: priority,
          assign_to_existing_clients: assignExisting
        })
      });

      setShowModal(false);
      setName('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            Requirement Templates Configurator
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Define custom compliance requirements, audit frequencies, reminder schedules, and evidence types per food business category.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Create Requirement Template
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Configured Requirements ({templates.length})</h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requirement Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Frequency</th>
                <th>Evidence Required</th>
                <th>Reminder Schedule</th>
                <th>Active Assignments</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{t.description || 'Standard requirement'}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                      {t.category_name}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-upcoming">{t.requirement_type}</span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: '#475569' }}>{t.frequency}</td>
                  <td style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: 600 }}>{t.evidence_type}</td>
                  <td>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                      {Array.isArray(t.reminder_schedule) ? t.reminder_schedule.join(', ') + ' days' : '30, 15, 7 days'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-compliant" style={{ fontSize: '11px' }}>
                      {t.active_assignments || 0} Clients
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Requirement Template (Demo Steps 12-14) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-submitted" style={{ fontSize: '11px', marginBottom: '4px' }}>
                  Consultant Configuration
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Create Requirement Template
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Requirement Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Annual Heavy Metal Assay or Water Microbial Analysis"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Business Category</label>
                  <select
                    className="form-select"
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Regulatory Guidelines</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Describe laboratory protocols, statutory standard, or certification guidelines..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Requirement Type</label>
                    <select className="form-select" value={reqType} onChange={e => setReqType(e.target.value)}>
                      <option value="STATUTORY">STATUTORY</option>
                      <option value="SAFETY">SAFETY</option>
                      <option value="QUALITY">QUALITY</option>
                      <option value="HYGIENE">HYGIENE</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <select className="form-select" value={frequency} onChange={e => setFrequency(e.target.value)}>
                      <option value="ANNUAL">ANNUAL (365 days)</option>
                      <option value="SEMI_ANNUAL">SEMI-ANNUAL (180 days)</option>
                      <option value="QUARTERLY">QUARTERLY (90 days)</option>
                      <option value="MONTHLY">MONTHLY (30 days)</option>
                      <option value="BIENNIAL">BIENNIAL (730 days)</option>
                      <option value="ONE_TIME">ONE-TIME</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Evidence Type</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. NABL Test Report (PDF)"
                      value={evidenceType}
                      onChange={e => setEvidenceType(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reminder Schedule (Days before)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="30, 15, 7"
                      value={reminders}
                      onChange={e => setReminders(e.target.value)}
                    />
                  </div>
                </div>

                {/* Demo Flow: Assign to all existing clients in category */}
                <div 
                  onClick={() => setAssignExisting(!assignExisting)}
                  style={{
                    padding: '12px 14px',
                    background: assignExisting ? '#eff6ff' : '#f8fafc',
                    border: assignExisting ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '8px'
                  }}
                >
                  {assignExisting ? <CheckSquare size={18} color="#2563eb" /> : <Square size={18} color="#94a3b8" />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                      Assign immediately to all active businesses in this category
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Demonstrates instant compliance rule rollout across client portfolio (Demo Steps 13 & 14)
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Save & Rollout Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
