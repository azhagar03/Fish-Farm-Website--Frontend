// src/components/admin/ProductManager.jsx - Full CRUD + Stock Management (Price & Category removed)
import React, { useEffect, useState } from 'react';
import { productAPI } from '../../services/api';

const UNITS = ['Pcs', 'Nos', 'Kg', 'Ltr', 'Round', 'Set', 'Pair'];
const EMPTY_FORM = { name: '', description: '', unit: 'Pcs', stock: '', isActive: true };

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [stockAdjust, setStockAdjust] = useState({});

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProducts = () => {
    setLoading(true);
    productAPI.getAll()
      .then(res => setProducts(res.data.data || []))
      .catch(() => showToast('Could not load products. Is backend running?', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: 0, category: 'Other' };
      if (editId) {
        await productAPI.update(editId, payload);
        showToast('Product updated successfully!');
      } else {
        await productAPI.create(payload);
        showToast('Product created successfully!');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', unit: p.unit, stock: p.stock, isActive: p.isActive });
    setEditId(p._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      showToast('Product deleted.');
      loadProducts();
    } catch {
      showToast('Error deleting product', 'error');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('This will replace all products with sample data. Continue?')) return;
    try {
      await productAPI.seed();
      showToast('Sample products seeded!');
      loadProducts();
    } catch {
      showToast('Error seeding data', 'error');
    }
  };

  const handleStockChange = async (product, delta) => {
    const adjust = parseInt(stockAdjust[product._id] || 1);
    if (!adjust || adjust <= 0) { showToast('Enter a valid adjustment quantity', 'error'); return; }
    const newStock = Math.max(0, (parseInt(product.stock) || 0) + (delta * adjust));
    try {
      await productAPI.update(product._id, { ...product, stock: newStock });
      showToast(`Stock ${delta > 0 ? 'increased' : 'decreased'} to ${newStock} ${product.unit}`);
      loadProducts();
    } catch {
      showToast('Error updating stock', 'error');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const stockColor = s => s > 10 ? 'var(--green-sea)' : s > 0 ? '#fbbf24' : '#ef4444';

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>Product Management</h5>
          <small style={{ color: 'var(--text-secondary)' }}>{products.length} products • {products.filter(p => p.stock < 10).length} low stock</small>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn" onClick={handleSeed} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.82rem' }}>
            <i className="bi bi-database-add me-1" />Seed Sample Data
          </button>
          <button className="btn-ocean btn" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
            <i className="bi bi-plus-lg me-1" />Add Product
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 style={{ margin: 0, color: 'var(--ocean-glow)', fontFamily: 'var(--font-accent)' }}>{editId ? 'Edit Product' : 'Add New Product'}</h6>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}><i className="bi bi-x" /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-8"><label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Product Name *</label><input name="name" className="form-control input-ocean" value={form.name} onChange={handleChange} required placeholder="e.g. Rohu Fish" /></div>
              <div className="col-md-4"><label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Unit</label><select name="unit" className="form-select input-ocean" value={form.unit} onChange={handleChange}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
              <div className="col-md-4"><label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Stock Quantity</label><input name="stock" className="form-control input-ocean" value={form.stock} onChange={handleChange} placeholder="0" /></div>
              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check form-switch"><input className="form-check-input" type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} id="activeSwitch" style={{ width: '3em', height: '1.5em' }} /><label className="form-check-label ms-2" htmlFor="activeSwitch" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active</label></div>
              </div>
              <div className="col-12"><label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Description</label><textarea name="description" className="form-control input-ocean" rows="2" value={form.description} onChange={handleChange} placeholder="Optional description..." /></div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn-ocean btn" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="bi bi-check2 me-1" />{editId ? 'Update' : 'Create'} Product</>}</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-sm-8">
            <div className="input-group" style={{ background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span className="input-group-text" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><i className="bi bi-search" /></span>
              <input className="form-control input-ocean" style={{ border: 'none' }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-sm-4 text-end"><small style={{ color: 'var(--text-secondary)' }}>{filtered.length} results</small></div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--ocean-light)' }} /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-ocean table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Unit</th>
                  <th style={{ minWidth: 200 }}>Stock Management</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>No products found</td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {p.name}
                      {p.stock < 10 && (
                        <span style={{ marginLeft: 6, fontSize: '0.65rem', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 6px', borderRadius: 10 }}>
                          {p.stock === 0 ? 'OUT' : 'LOW'}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.unit}</td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <button
                          onClick={() => handleStockChange(p, -1)}
                          className="btn btn-sm"
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, padding: '3px 8px', lineHeight: 1 }}
                          title="Decrease stock"
                        >
                          <i className="bi bi-dash" />
                        </button>
                        <input
                          value={stockAdjust[p._id] !== undefined ? stockAdjust[p._id] : 1}
                          onChange={e => setStockAdjust(prev => ({ ...prev, [p._id]: e.target.value }))}
                          style={{ width: 52, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--ocean-foam)', padding: '3px 6px', fontSize: '0.82rem', textAlign: 'center' }}
                        />
                        <button
                          onClick={() => handleStockChange(p, 1)}
                          className="btn btn-sm"
                          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#4ade80', borderRadius: 6, padding: '3px 8px', lineHeight: 1 }}
                          title="Increase stock"
                        >
                          <i className="bi bi-plus" />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: stockColor(parseInt(p.stock) || 0), marginLeft: 4, minWidth: 32 }}>
                          {p.stock !== undefined ? p.stock : '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: p.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)', color: p.isActive ? '#4ade80' : '#94a3b8', border: `1px solid ${p.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.2)'}` }}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button onClick={() => handleEdit(p)} className="btn btn-sm" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--ocean-light)', borderRadius: 6, padding: '4px 10px' }}><i className="bi bi-pencil" /></button>
                        <button onClick={() => handleDelete(p._id)} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--coral)', borderRadius: 6, padding: '4px 10px' }}><i className="bi bi-trash" /></button>
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

export default ProductManager;
