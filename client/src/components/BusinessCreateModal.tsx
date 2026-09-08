import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { BusinessCategory, RequirementTemplate } from '../types';
import { X, Building2, Layers, CheckSquare, Square, AlertCircle, Plus } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: (newBusinessId: number) => void;
}

export const BusinessCreateModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [templates, setTemplates] = useState<RequirementTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Manufacturing Unit');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('Plot No. 42, MIDC Food Processing Zone');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiRequest('/categories');
        setCategories(data.categories || []);
        if (data.categories && data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id.toString());
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadCategories();
  }, []);

  // When category changes, load applicable templates (Specification Section 21)
  useEffect(() => {
    const loadTemplates = async () => {
      if (!selectedCategory) return;
      try {
        const data = await apiRequest(`/templates?category_id=${selectedCategory}`);
        const loadedTemplates: RequirementTemplate[] = data.templates || [];
        setTemplates(loadedTemplates);
        // By default select all templates for this category
        setSelectedTemplateIds(loadedTemplates.map(t => t.id));
      } catch (e) {
        console.error(e);
      }
    };
    loadTemplates();
  }, [selectedCategory]);

  const toggleTemplate = (id: number) => {
    setSelectedTemplateIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !selectedCategory) {
      setError('Business name and business category are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiRequest('/businesses', {
        method: 'POST',
        body: JSON.stringify({
          business_name: businessName.trim(),
          business_category_id: parseInt(selectedCategory, 10),
          business_type: businessType,
          contact_person: contactPerson.trim() || 'Operations Lead',
          phone: phone.trim() || '+91 98200 00000',
          email: email.trim() || `contact@${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.demo`,
          address,
          city,
          state,
          selected_template_ids: selectedTemplateIds
        })
      });

      onSuccess(res.business.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge badge-compliant" style={{ fontSize: '11px', marginBottom: '4px' }}>
              Client Onboarding Workflow
            </span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Add New Food Business
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Section 1: Business Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Anand Papads & Spices"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Category *</label>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Facility Type</label>
                <input
                  type="text"
                  className="form-input"
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Manager / Owner"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 98000 00000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </div>
            </div>

            {/* Section 2: Applicable Requirement Templates (Section 21) */}
            <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                    Applicable Requirement Templates
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    These requirements will be automatically generated with calculated due dates for this client.
                  </p>
                </div>
                <span className="badge badge-submitted" style={{ fontSize: '11px' }}>
                  {selectedTemplateIds.length} Selected
                </span>
              </div>

              {templates.length === 0 ? (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No requirement templates configured for this category yet. You can create templates in the Templates tab.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {templates.map(t => {
                    const isChecked = selectedTemplateIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTemplate(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: isChecked ? '#eff6ff' : '#ffffff',
                          border: isChecked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isChecked ? <CheckSquare size={16} color="#2563eb" /> : <Square size={16} color="#94a3b8" />}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Type: {t.requirement_type} • Frequency: {t.frequency} • Evidence: {t.evidence_type}
                            </div>
                          </div>
                        </div>
                        <span className="badge badge-upcoming" style={{ fontSize: '10px' }}>
                          {t.default_duration_days} Days Horizon
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Plus size={15} />
              {loading ? 'Creating Business...' : `Create Business & Assign ${selectedTemplateIds.length} Requirements`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
