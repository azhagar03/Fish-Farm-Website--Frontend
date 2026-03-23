// src/components/admin/FishPriceManager.jsx
import React, { useEffect, useState } from 'react';
import { fishPriceAPI } from '../../services/api';

const FishPriceManager = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editAvailability, setEditAvailability] = useState('In Stock');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    fishPriceAPI.getAll()
      .then(res => setPrices(res.data.data || []))
      .catch(() => showToast('Error loading prices', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    if (!window.confirm('Seed sample fish prices?')) return;
    try {
      await fishPriceAPI.seed();
      showToast('Fish prices seeded!');
      load();
    } catch { showToast('Error seeding', 'error'); }
  };

  const startEdit = (p) => {
    setEditId(p._id);
    setEditPrice(p.currentPrice);
    setEditAvailability(p.availability);
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await fishPriceAPI.update(id, { currentPrice: parseFloat(editPrice), availability: editAvailability });
      showToast('Price updated!');
      setEditId(null);
      load();
    } catch { showToast('Error updating', 'error'); }
    finally { setSaving(false); }
  };

  const catColor = c => ({ Ornamental: '#06b6d4', Tropical: '#8b5cf6', Coldwater: '#3b82f6', Marine: '#10b981', 'Food Fish': '#f59e0b' }[c] || '#94a3b8');
  const availColor = a => ({ 'In Stock': '#4ade80', Limited: '#fbbf24', 'Out of Stock': '#f87171' }[a] || '#94a3b8');

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600 }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>Live Fish Price Manager</h5>
          <small style={{ color: 'var(--text-secondary)' }}>Update prices — changes reflect on website ticker instantly</small>
        </div>
        <button className="btn" onClick={handleSeed} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.82rem' }}>
          <i className="bi bi-database-add me-1" />Seed Sample Prices
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--ocean-light)' }} /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-ocean table-hover mb-0">
              <thead>
                <tr>
                  <th>Fish Name</th>
                  <th>Category</th>
                  <th>Current Price</th>
                  <th>Prev Price</th>
                  <th>Change</th>
                  <th>Availability</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prices.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <i className="bi bi-fish" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }} />
                    No fish prices. Click Seed to add sample data.
                  </td></tr>
                ) : prices.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>🐟 {p.fishName}</td>
                    <td>
                      <span style={{ background: `${catColor(p.category)}22`, color: catColor(p.category), border: `1px solid ${catColor(p.category)}44`, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                        {p.category}
                      </span>
                    </td>
                    <td>
                      {editId === p._id ? (
                        <input type="number" min="0" step="1" className="form-control input-ocean" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: 100, fontSize: '0.85rem' }} />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-light)', fontSize: '1rem' }}>₹{p.currentPrice}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {p.previousPrice ? `₹${p.previousPrice}` : '—'}
                    </td>
                    <td>
                      {p.priceChange !== 0 ? (
                        <span className={p.priceChange > 0 ? 'price-up' : 'price-down'} style={{ fontWeight: 700 }}>
                          {p.priceChange > 0 ? '▲' : '▼'} {Math.abs(p.priceChange)}%
                        </span>
                      ) : <span style={{ color: 'var(--text-secondary)' }}>─</span>}
                    </td>
                    <td>
                      {editId === p._id ? (
                        <select className="form-select input-ocean" value={editAvailability} onChange={e => setEditAvailability(e.target.value)} style={{ width: 130, fontSize: '0.82rem' }}>
                          <option>In Stock</option>
                          <option>Limited</option>
                          <option>Out of Stock</option>
                        </select>
                      ) : (
                        <span style={{ background: `${availColor(p.availability)}22`, color: availColor(p.availability), border: `1px solid ${availColor(p.availability)}44`, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                          {p.availability}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.unit}</td>
                    <td>
                      {editId === p._id ? (
                        <div className="d-flex gap-1">
                          <button onClick={() => saveEdit(p._id)} className="btn btn-sm" disabled={saving} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#4ade80', borderRadius: 6, padding: '4px 10px' }}>
                            {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check2" />}
                          </button>
                          <button onClick={() => setEditId(null)} className="btn btn-sm" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: 6, padding: '4px 10px' }}>
                            <i className="bi bi-x" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(p)} className="btn btn-sm" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--ocean-light)', borderRadius: 6, padding: '4px 10px' }}>
                          <i className="bi bi-pencil me-1" />Edit
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
    </div>
  );
};

export default FishPriceManager;
