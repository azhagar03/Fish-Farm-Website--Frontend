// src/components/admin/AdminUsersManager.jsx
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

const AdminUsersManager = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', name: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAll();
      setAdmins(res.data.data || []);
    } catch { showToast('Error loading admins', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.password.trim())
      return showToast('All fields required', 'error');
    if (form.password.length < 6)
      return showToast('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      await adminAPI.create(form);
      showToast('Admin user created');
      setForm({ username: '', password: '', name: '' });
      setShowForm(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating admin', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (admins.length <= 1) return showToast('Cannot delete the last admin!', 'error');
    if (!window.confirm(`Delete admin "${name}"?`)) return;
    try {
      await adminAPI.delete(id);
      showToast('Admin deleted');
      load();
    } catch { showToast('Error deleting admin', 'error'); }
  };

  const currentUsername = localStorage.getItem('admin_username');

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600 }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>Admin Users</h5>
          <small style={{ color: 'var(--text-secondary)' }}>Manage login credentials for admin panel access</small>
        </div>
        <button className="btn-ocean btn" onClick={() => setShowForm(true)}>
          <i className="bi bi-person-plus me-2" />Add Admin
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(6,182,212,0.4)' }}>
          <h6 style={{ color: 'var(--ocean-glow)', marginBottom: 20 }}><i className="bi bi-person-plus me-2" />New Admin User</h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Full Name *</label>
                <input className="form-control input-ocean" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Admin full name" required />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Username *</label>
                <input className="form-control input-ocean" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))} placeholder="login username" required />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Password *</label>
                <input type="password" className="form-control input-ocean" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" required />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-ocean btn" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : <><i className="bi bi-floppy me-2" />Create Admin</>}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--ocean-light)' }} /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-ocean mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, i) => (
                  <tr key={admin._id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 700, color: 'var(--ocean-foam)' }}>{admin.name}</td>
                    <td>
                      <code style={{ background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: 4, color: 'var(--ocean-light)', fontSize: '0.85rem' }}>
                        {admin.username}
                      </code>
                      {admin.username === currentUsername && (
                        <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'rgba(16,185,129,0.2)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '1px 6px' }}>You</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(admin.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.3)' }}>
                        Active
                      </span>
                    </td>
                    <td>
                      {admin.username !== currentUsername && (
                        <button onClick={() => handleDelete(admin._id, admin.name)} className="btn btn-sm" title="Delete" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--coral)', borderRadius: 6, padding: '4px 10px' }}>
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card p-4 mt-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <h6 style={{ color: 'var(--gold)', marginBottom: 8 }}><i className="bi bi-shield-lock me-2" />Security Notes</h6>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 0, paddingLeft: 20 }}>
          <li>Passwords are hashed using SHA-256 and cannot be recovered</li>
          <li>You cannot delete your own account</li>
          <li>At least one admin must always exist</li>
          <li>Default credentials: <strong style={{ color: 'var(--ocean-light)' }}>admin / admin123</strong> — change this immediately!</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminUsersManager;
