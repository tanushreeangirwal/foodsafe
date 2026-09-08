import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { Business, BusinessCategory } from '../types';
import { Building2, Search, Plus, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onSelectBusiness: (id: number) => void;
  onOpenAddBusiness: () => void;
}

export const BusinessesListView: React.FC<Props> = ({ onSelectBusiness, onOpenAddBusiness }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, cData] = await Promise.all([
        apiRequest('/businesses'),
        apiRequest('/categories')
      ]);
      setBusinesses(bData.businesses || []);
      setCategories(cData.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = businesses.filter(b => {
    if (categoryFilter && b.business_category_id !== parseInt(categoryFilter, 10)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.business_name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.contact_person.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            Managed Food Businesses
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Directory of all client manufacturing plants, kitchens, bakeries, and retail food establishments.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddBusiness}>
          <Plus size={16} />
          Add Business
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <h2 className="card-title">All Businesses ({filtered.length})</h2>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search business, city, or contact..."
                className="form-input"
                style={{ paddingLeft: '32px', width: '240px', height: '34px', fontSize: '12.5px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '190px', height: '34px', fontSize: '12.5px' }}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Category</th>
                <th>Contact Person</th>
                <th>City / State</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr 
                  key={b.id} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectBusiness(b.id)}
                >
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.business_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{b.business_type}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                      {b.category_name}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#0f172a' }}>{b.contact_person}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{b.phone}</div>
                  </td>
                  <td>{b.city}, {b.state}</td>
                  <td>
                    {b.status === 'COMPLIANT' && <span className="badge badge-compliant"><CheckCircle2 size={11} /> Compliant</span>}
                    {b.status === 'ATTENTION_REQUIRED' && <span className="badge badge-attention"><AlertCircle size={11} /> Attention</span>}
                    {b.status === 'CRITICAL' && <span className="badge badge-critical"><AlertCircle size={11} /> Critical</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBusiness(b.id);
                      }}
                    >
                      View Profile
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
