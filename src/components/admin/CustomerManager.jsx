// src/components/admin/CustomerManager.jsx
import React, { useEffect, useState } from 'react';
import { customerAPI } from '../../services/api';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry'
];

const emptyForm = { name: '', mobile: '', city: '', state: 'Tamil Nadu' };

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data.data || []);
    } catch { showToast('Error loading customers', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast('Name is required', 'error');
    if (!form.mobile.trim()) return showToast('Mobile number is required', 'error');
    setSaving(true);
    try {
      if (editId) {
        await customerAPI.update(editId, form);
        showToast('Customer updated');
      } else {
        await customerAPI.create(form);
        showToast('Customer added');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving customer', 'error');
    }
    setSaving(false);
  };

  const handleEdit = (c) => {
    setForm({ name: c.name, mobile: c.mobile, city: c.city || '', state: c.state || 'Tamil Nadu' });
    setEditId(c._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer? Their invoice history will remain.')) return;
    try {
      await customerAPI.delete(id);
      showToast('Customer deleted');
      load();
    } catch { showToast('Error deleting customer', 'error'); }
  };

  const handleCancel = () => { setForm(emptyForm); setEditId(null); setShowForm(false); };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>Customer Management</h5>
          <small style={{ color: 'var(--text-secondary)' }}>{customers.length} total customers</small>
        </div>
        <button className="btn-ocean btn" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}>
          <i className="bi bi-person-plus me-2" />Add Customer
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(6,182,212,0.4)', boxShadow: '0 0 20px rgba(6,182,212,0.1)' }}>
          <h6 style={{ color: 'var(--ocean-glow)', fontFamily: 'var(--font-accent)', marginBottom: 20 }}>
            <i className={`bi ${editId ? 'bi-pencil' : 'bi-person-plus'} me-2`} />
            {editId ? 'Edit Customer' : 'Add New Customer'}
          </h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Full Name *</label>
                <input
                  className="form-control input-ocean"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Mobile Number *</label>
                <input
                  className="form-control input-ocean"
                  value={form.mobile}
                  onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                  placeholder="10-digit mobile"
                  maxLength={15}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>City</label>
                <input
                  className="form-control input-ocean"
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="City / Town"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>State</label>
                <select
                  className="form-select input-ocean"
                  value={form.state}
                  onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                >
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-ocean btn" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="bi bi-floppy me-2" />{editId ? 'Update' : 'Save Customer'}</>}
              </button>
              <button type="button" className="btn" onClick={handleCancel} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="glass-card p-3 mb-3">
        <div className="input-group" style={{ background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
          <span className="input-group-text" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><i className="bi bi-search" /></span>
          <input className="form-control input-ocean" style={{ border: 'none' }} placeholder="Search by name, mobile or city..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--ocean-light)' }} /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-ocean table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Total Purchased</th>
                  <th>Balance Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <i className="bi bi-people" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }} />
                    No customers found. Add your first customer!
                  </td></tr>
                ) : filtered.map((c, i) => (
                  <tr key={c._id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ocean-foam)' }}>{c.name}</div>
                    </td>
                    <td>
                      <a href={`tel:${c.mobile}`} style={{ color: 'var(--ocean-light)', textDecoration: 'none' }}>
                        <i className="bi bi-telephone me-1" />{c.mobile}
                      </a>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.city || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{c.state || '—'}</td>
                    <td style={{ color: 'var(--gold-light)', fontWeight: 600 }}>₹{Number(c.totalPurchased || 0).toLocaleString('en-IN')}</td>
                    <td>
                      {c.balanceAmount > 0 ? (
                        <span style={{ color: '#fca5a5', fontWeight: 700 }}>₹{Number(c.balanceAmount).toLocaleString('en-IN')}</span>
                      ) : (
                        <span style={{ color: '#4ade80', fontSize: '0.82rem' }}>✓ Cleared</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button onClick={() => handleEdit(c)} className="btn btn-sm" title="Edit" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--ocean-light)', borderRadius: 6, padding: '4px 10px' }}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="btn btn-sm" title="Delete" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--coral)', borderRadius: 6, padding: '4px 10px' }}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManager;
