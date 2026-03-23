// src/components/admin/InvoiceManager.jsx
import React, { useEffect, useState } from 'react';
import { invoiceAPI } from '../../services/api';
import { InvoicePrintView } from './CreateInvoice';

const InvoiceManager = ({ onNew }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    invoiceAPI.getAll()
      .then(res => setInvoices(res.data.data || []))
      .catch(() => showToast('Error loading invoices', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await invoiceAPI.delete(id);
      showToast('Invoice deleted');
      load();
      if (viewInvoice?._id === id) setViewInvoice(null);
    } catch {
      showToast('Error deleting invoice', 'error');
    }
  };

  const handlePrint = () => window.print();

  const filtered = invoices.filter(inv =>
    inv.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
    String(inv.invoiceNo).includes(search)
  );

  const statusColor = s => ({ Paid: '#4ade80', Pending: '#fbbf24', Partial: '#fb923c' }[s] || '#94a3b8');

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600 }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      {/* View Modal */}
      {viewInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setViewInvoice(null)}>
          <div style={{ background: 'var(--ocean-mid)', border: '1px solid var(--glass-border)', borderRadius: 16, maxWidth: 800, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div className="d-flex justify-content-between align-items-center mb-3 no-print">
              <h6 style={{ margin: 0, color: 'var(--ocean-glow)' }}>Invoice #{viewInvoice.invoiceNo}</h6>
              <div className="d-flex gap-2">
                <button className="btn-ocean btn btn-sm" onClick={handlePrint}>
                  <i className="bi bi-printer me-1" />Print
                </button>
                <button onClick={() => setViewInvoice(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>
                  <i className="bi bi-x" />
                </button>
              </div>
            </div>
            <InvoicePrintView invoice={viewInvoice} />
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>Invoice History</h5>
          <small style={{ color: 'var(--text-secondary)' }}>{invoices.length} total invoices</small>
        </div>
        <button className="btn-ocean btn" onClick={onNew}>
          <i className="bi bi-file-plus me-2" />Create Invoice
        </button>
      </div>

      <div className="glass-card p-3 mb-3">
        <div className="input-group" style={{ background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
          <span className="input-group-text" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><i className="bi bi-search" /></span>
          <input className="form-control input-ocean" style={{ border: 'none' }} placeholder="Search by buyer name or invoice number..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <th>Invoice No</th>
                  <th>Buyer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Grand Total</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }} />
                    No invoices found. Create your first invoice!
                  </td></tr>
                ) : filtered.map(inv => (
                  <tr key={inv._id}>
                    <td><span style={{ color: 'var(--ocean-glow)', fontWeight: 700, fontSize: '1rem' }}>#{inv.invoiceNo}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.buyerName}</div>
                      {inv.buyerAddress && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inv.buyerAddress}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{inv.items?.length || 0} items</td>
                    <td style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '1rem' }}>₹{Number(inv.grandTotal || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: `${statusColor(inv.paymentStatus)}22`, color: statusColor(inv.paymentStatus), border: `1px solid ${statusColor(inv.paymentStatus)}44` }}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button onClick={() => setViewInvoice(inv)} className="btn btn-sm" title="View" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--ocean-light)', borderRadius: 6, padding: '4px 10px' }}>
                          <i className="bi bi-eye" />
                        </button>
                        <button onClick={() => handleDelete(inv._id)} className="btn btn-sm" title="Delete" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--coral)', borderRadius: 6, padding: '4px 10px' }}>
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

export default InvoiceManager;
