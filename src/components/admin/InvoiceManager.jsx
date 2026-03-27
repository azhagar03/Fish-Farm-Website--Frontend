// src/components/admin/InvoiceManager.jsx
import React, { useEffect, useState } from 'react';
import { invoiceAPI } from '../../services/api';
import { InvoicePrintView, handleWhatsAppPDF, generateInvoiceHTML  } from './CreateInvoice';

const PERIODS = [
  { label: 'All', value: '' },
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
];

const statusColor = s => ({ Paid: '#4ade80', Pending: '#fbbf24', Partial: '#fb923c' }[s] || '#94a3b8');

const InvoiceManager = ({ onNew, onEdit }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (period && period !== 'custom') params.period = period;
      else if (period === 'custom') { if (startDate) params.startDate = startDate; if (endDate) params.endDate = endDate; }
      const res = await invoiceAPI.getAll(params);
      setInvoices(res.data.data || []);
    } catch { showToast('Error loading invoices', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [period, startDate, endDate]);

  const handleDelete = async (id, invoiceNo) => {
    if (!window.confirm(`Delete Invoice #${invoiceNo}? This action cannot be undone.`)) return;
    try {
      await invoiceAPI.delete(id);
      showToast(`Invoice #${invoiceNo} deleted`);
      load();
      if (viewInvoice?._id === id) setViewInvoice(null);
    } catch { showToast('Error deleting invoice', 'error'); }
  };

  /* ── Print invoice in new window (A4 multi-page) ── */
const handlePrint = async (inv) => {
  try {
    // ✅ WAIT for HTML generation
    const htmlContent = await generateInvoiceHTML(inv);

    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      showToast('Allow popups to print', 'error');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content + images to load
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1000);

  } catch (err) {
    console.error('Print error:', err);
    showToast('Error generating PDF', 'error');
  }
};

  const handleExport = (inv) => {
    const rows = [
      ['MUTHUPANDI FISH FARM'],
      ['6/201 ITI Colony, Aathikulam, K.Pudur - Madurai 7'],
      [], ['INVOICE'],
      ['Invoice No', inv.invoiceNo, 'Date', new Date(inv.invoiceDate).toLocaleDateString('en-IN')],
      ['Buyer', inv.buyerName, 'Phone', inv.buyerPhone || ''],
      [],
      ['Sl.No', 'Description', 'Qty', 'Pack', 'Rate', 'Disc', 'Amount'],
      ...inv.items.map(i => [i.slNo, i.description, i.quantity, i.pack, i.rate, i.discount || 0, i.amount]),
      [],
      ['', '', '', '', '', 'Net Amount', inv.netAmount || inv.grandTotal],
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Invoice_${inv.invoiceNo}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = invoices.filter(inv =>
    inv.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
    String(inv.invoiceNo).includes(search) ||
    inv.buyerPhone?.includes(search)
  );

  const totalRevenue = filtered.reduce((s, i) => s + (i.netAmount || i.grandTotal || 0), 0);
  const totalGst = filtered.reduce((s, i) => s + (i.totalGst || 0), 0);
  const totalBalance = filtered.reduce((s, i) => s + (i.balanceAmount || 0), 0);

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600 }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      {/* View Modal */}
      {viewInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && setViewInvoice(null)}>
          <div style={{ background: 'var(--ocean-mid)', border: '1px solid var(--glass-border)', borderRadius: 16, maxWidth: 860, width: '100%', maxHeight: '92vh', overflow: 'auto', padding: 24 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 style={{ margin: 0, color: 'var(--ocean-glow)' }}>Invoice #{viewInvoice.invoiceNo}</h6>
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-sm" onClick={() => handleWhatsAppPDF(viewInvoice)} style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.4)', color: '#4ade80' }}>
                  <i className="bi bi-whatsapp me-1" />WhatsApp PDF
                </button>
                <button className="btn btn-sm" onClick={() => handleExport(viewInvoice)} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green-sea)' }}>
                  <i className="bi bi-file-earmark-excel me-1" />CSV
                </button>
                <button className="btn-ocean btn btn-sm" onClick={() => handlePrint(viewInvoice)}><i className="bi bi-printer me-1" />Print/PDF</button>
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
          <small style={{ color: 'var(--text-secondary)' }}>{filtered.length} invoices • Revenue: ₹{totalRevenue.toLocaleString('en-IN')}</small>
        </div>
        <button className="btn-ocean btn" onClick={onNew}><i className="bi bi-file-plus me-2" />Create Invoice</button>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <div className="input-group" style={{ background: 'var(--glass)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span className="input-group-text" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><i className="bi bi-search" /></span>
              <input className="form-control input-ocean" style={{ border: 'none' }} placeholder="Search name, invoice no, phone..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="d-flex gap-1 flex-wrap">
              {PERIODS.map(p => (
                <button key={p.value} className="btn btn-sm" onClick={() => setPeriod(p.value)} style={{
                  background: period === p.value ? 'rgba(6,182,212,0.2)' : 'var(--glass)',
                  border: `1px solid ${period === p.value ? 'rgba(6,182,212,0.5)' : 'var(--glass-border)'}`,
                  color: period === p.value ? 'var(--ocean-light)' : 'var(--text-secondary)',
                  fontSize: '0.78rem', padding: '4px 10px', borderRadius: 6
                }}>{p.label}</button>
              ))}
            </div>
          </div>
          {period === 'custom' && (
            <div className="col-md-4 d-flex gap-2">
              <input type="date" className="form-control input-ocean form-control-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <input type="date" className="form-control input-ocean form-control-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {filtered.length > 0 && (
        <div className="row g-3 mb-3">
          {[
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'var(--gold)', icon: 'bi-currency-rupee' },
            { label: 'Total GST', value: `₹${totalGst.toLocaleString('en-IN')}`, color: 'var(--ocean-glow)', icon: 'bi-percent' },
            { label: 'Balance Due', value: `₹${totalBalance.toLocaleString('en-IN')}`, color: totalBalance > 0 ? '#fca5a5' : '#4ade80', icon: 'bi-exclamation-circle' },
            { label: 'Invoices', value: filtered.length, color: 'var(--ocean-light)', icon: 'bi-receipt' },
          ].map(c => (
            <div key={c.label} className="col-6 col-md-3">
              <div className="glass-card p-3 d-flex align-items-center gap-2">
                <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: '1.2rem' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.label}</div>
                  <div style={{ color: c.color, fontWeight: 800, fontSize: '0.95rem' }}>{c.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
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
                  <th>Net Amount</th>
                  <th>GST</th>
                  <th>Balance</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }} />
                    No invoices found.
                  </td></tr>
                ) : filtered.map(inv => (
                  <tr key={inv._id}>
                    <td><span style={{ color: 'var(--ocean-glow)', fontWeight: 700 }}>#{inv.invoiceNo}</span>
                      {inv.accountingYearLabel && <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>FY {inv.accountingYearLabel}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.buyerName}</div>
                      {inv.buyerPhone && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{inv.buyerPhone}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--gold-light)' }}>₹{Number(inv.netAmount || inv.grandTotal || 0).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--ocean-light)', fontSize: '0.85rem' }}>{inv.totalGst > 0 ? `₹${Number(inv.totalGst).toLocaleString('en-IN')}` : '—'}</td>
                    <td>
                      {inv.balanceAmount > 0
                        ? <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.85rem' }}>₹{Number(inv.balanceAmount).toLocaleString('en-IN')}</span>
                        : <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>✓ Cleared</span>}
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: `${statusColor(inv.paymentStatus)}22`, color: statusColor(inv.paymentStatus), border: `1px solid ${statusColor(inv.paymentStatus)}44` }}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <button onClick={() => setViewInvoice(inv)} className="btn btn-sm" title="View" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--ocean-light)', borderRadius: 6, padding: '4px 8px' }}>
                          <i className="bi bi-eye" />
                        </button>
                        <button onClick={() => handlePrint(inv)} className="btn btn-sm" title="Print/PDF" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--coral)', borderRadius: 6, padding: '4px 8px' }}>
                          <i className="bi bi-printer" />
                        </button>
                        <button onClick={() => handleWhatsAppPDF(inv)} className="btn btn-sm" title="WhatsApp PDF" style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.4)', color: '#4ade80', borderRadius: 6, padding: '4px 8px' }}>
                          <i className="bi bi-whatsapp" />
                        </button>
                        <button onClick={() => handleExport(inv)} className="btn btn-sm" title="Export CSV" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green-sea)', borderRadius: 6, padding: '4px 8px' }}>
                          <i className="bi bi-download" />
                        </button>
                        <button onClick={() => handleDelete(inv._id, inv.invoiceNo)} className="btn btn-sm" title="Delete" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--coral)', borderRadius: 6, padding: '4px 8px' }}>
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