// src/components/admin/CreateInvoice.jsx
// Full invoice creator with real-time total calculation and print functionality
import React, { useState, useEffect, useRef } from 'react';
import { invoiceAPI, productAPI } from '../../services/api';

const UNITS = ['Pcs', 'Nos', 'Kg', 'Ltr', 'Round', 'Set', 'Pair'];

const emptyItem = () => ({
  _tempId: Date.now() + Math.random(),
  description: '',
  quantity: 1,
  pack: 'Pcs',
  rate: 0,
  discount: 0,
  amount: 0
});

const CreateInvoice = ({ onSaved, editData }) => {
  const printRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [toast, setToast] = useState(null);

  const [header, setHeader] = useState({
    buyerName: '',
    buyerAddress: '',
    buyerPhone: '',
    state: 'Tamil Nadu',
    stateCode: '33',
    gstin: '33ARIPM4129M1ZK',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'Pending',
    notes: ''
  });

  const [items, setItems] = useState([emptyItem()]);

  // Totals computed in real-time
  const totals = items.reduce((acc, item) => {
    const amt = parseFloat(((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0) - (parseFloat(item.discount) || 0)).toFixed(2));
    acc.subtotal += amt;
    acc.discount += parseFloat(item.discount) || 0;
    return acc;
  }, { subtotal: 0, discount: 0 });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    productAPI.getAll({ isActive: true })
      .then(res => setProducts(res.data.data || []))
      .catch(() => {});

    if (editData) {
      setHeader({
        buyerName: editData.buyerName || '',
        buyerAddress: editData.buyerAddress || '',
        buyerPhone: editData.buyerPhone || '',
        state: editData.state || 'Tamil Nadu',
        stateCode: editData.stateCode || '33',
        gstin: editData.gstin || '33ARIPM4129M1ZK',
        invoiceDate: editData.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        paymentStatus: editData.paymentStatus || 'Pending',
        notes: editData.notes || ''
      });
      setItems(editData.items?.map(i => ({ ...i, _tempId: Math.random() })) || [emptyItem()]);
    }
  }, [editData]);

  // Update item field and recalc amount instantly
  const updateItem = (tempId, field, value) => {
    setItems(prev => prev.map(item => {
      if (item._tempId !== tempId) return item;
      const updated = { ...item, [field]: value };
      updated.amount = parseFloat(((parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0) - (parseFloat(updated.discount) || 0)).toFixed(2));
      return updated;
    }));
  };

  // When a product is selected from dropdown, auto-fill rate and pack
  const selectProduct = (tempId, productName) => {
    const prod = products.find(p => p.name === productName);
    setItems(prev => prev.map(item => {
      if (item._tempId !== tempId) return item;
      const updated = { ...item, description: productName, rate: prod ? prod.price : item.rate, pack: prod ? prod.unit : item.pack };
      updated.amount = parseFloat(((parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0) - (parseFloat(updated.discount) || 0)).toFixed(2));
      return updated;
    }));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (tempId) => {
    if (items.length === 1) return showToast('At least one item required', 'error');
    setItems(prev => prev.filter(i => i._tempId !== tempId));
  };

  const handleHeaderChange = e => setHeader(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!header.buyerName.trim()) return showToast('Buyer name is required', 'error');
    if (items.some(i => !i.description.trim())) return showToast('All items must have a description', 'error');

    setSaving(true);
    try {
      const payload = {
        ...header,
        items: items.map((item, idx) => ({
          slNo: idx + 1,
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          pack: item.pack,
          rate: parseFloat(item.rate) || 0,
          discount: parseFloat(item.discount) || 0,
          amount: parseFloat(((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0) - (parseFloat(item.discount) || 0)).toFixed(2))
        }))
      };
      const res = editData
        ? await invoiceAPI.update(editData._id, payload)
        : await invoiceAPI.create(payload);
      setSavedInvoice(res.data.data);
      setSaved(true);
      showToast(`Invoice #${res.data.data.invoiceNo} saved successfully!`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving invoice', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const handleNew = () => {
    setSaved(false);
    setSavedInvoice(null);
    setHeader({ buyerName: '', buyerAddress: '', buyerPhone: '', state: 'Tamil Nadu', stateCode: '33', gstin: '33ARIPM4129M1ZK', invoiceDate: new Date().toISOString().split('T')[0], paymentStatus: 'Pending', notes: '' });
    setItems([emptyItem()]);
  };

  // ─── PRINT VIEW ────────────────────────────────────────────────────────────
  if (saved && savedInvoice) {
    return (
      <>
        {/* Print-only styles injected inline */}
        <style>{`
          @media print {
            body > * { display: none !important; }
            #print-invoice-root { display: block !important; }
            .no-print { display: none !important; }
          }
          #print-invoice-root { display: none; }
          @media print { #print-invoice-root { display: block !important; font-family: Arial, sans-serif; padding: 20px; background: white; color: black; } }
        `}</style>

        {/* Screen view of saved invoice */}
        <div className="no-print">
          {toast && (
            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600 }}>
              <i className="bi bi-check-circle me-2" />{toast.msg}
            </div>
          )}

          <div className="d-flex gap-2 mb-4 flex-wrap">
            <button className="btn-ocean btn" onClick={handlePrint}>
              <i className="bi bi-printer me-2" />Print Invoice
            </button>
            <button className="btn" onClick={handleNew} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
              <i className="bi bi-file-plus me-2" />New Invoice
            </button>
            <button className="btn" onClick={() => onSaved && onSaved()} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
              <i className="bi bi-list-ul me-2" />All Invoices
            </button>
          </div>

          {/* Invoice preview card */}
          <div className="glass-card p-4" ref={printRef}>
            <InvoicePrintView invoice={savedInvoice} />
          </div>
        </div>

        {/* Hidden print-only div */}
        <div id="print-invoice-root">
          <InvoicePrintView invoice={savedInvoice} printMode />
        </div>
      </>
    );
  }

  // ─── FORM VIEW ─────────────────────────────────────────────────────────────
  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>
            {editData ? 'Edit Invoice' : 'Create New Invoice'}
          </h5>
          <small style={{ color: 'var(--text-secondary)' }}>Auto-generates invoice number • Real-time total calculation</small>
        </div>
        <button className="btn-ocean btn" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="bi bi-floppy me-2" />Save Invoice</>}
        </button>
      </div>

      {/* Buyer Info */}
      <div className="glass-card p-4 mb-4">
        <h6 style={{ color: 'var(--ocean-glow)', fontFamily: 'var(--font-accent)', marginBottom: '16px' }}>
          <i className="bi bi-person-fill me-2" />Buyer Information
        </h6>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Buyer Name *</label>
            <input name="buyerName" className="form-control input-ocean" value={header.buyerName} onChange={handleHeaderChange} placeholder="MURUGANANTHAM SIVAGANGAI" />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Phone</label>
            <input name="buyerPhone" className="form-control input-ocean" value={header.buyerPhone} onChange={handleHeaderChange} placeholder="9876543210" />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Invoice Date</label>
            <input name="invoiceDate" type="date" className="form-control input-ocean" value={header.invoiceDate} onChange={handleHeaderChange} />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Address</label>
            <input name="buyerAddress" className="form-control input-ocean" value={header.buyerAddress} onChange={handleHeaderChange} placeholder="City / Town" />
          </div>
          <div className="col-md-4">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>State</label>
            <input name="state" className="form-control input-ocean" value={header.state} onChange={handleHeaderChange} />
          </div>
          <div className="col-md-2">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>State Code</label>
            <input name="stateCode" className="form-control input-ocean" value={header.stateCode} onChange={handleHeaderChange} />
          </div>
          <div className="col-md-2">
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Payment</label>
            <select name="paymentStatus" className="form-select input-ocean" value={header.paymentStatus} onChange={handleHeaderChange}>
              <option>Pending</option>
              <option>Paid</option>
              <option>Partial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="glass-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 style={{ color: 'var(--ocean-glow)', fontFamily: 'var(--font-accent)', margin: 0 }}>
            <i className="bi bi-table me-2" />Invoice Items
          </h6>
          <button className="btn btn-sm" onClick={addItem} style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--ocean-light)' }}>
            <i className="bi bi-plus-lg me-1" />Add Row
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-ocean mb-0">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ minWidth: 220 }}>Description</th>
                <th style={{ width: 90 }}>Qty</th>
                <th style={{ width: 90 }}>Pack</th>
                <th style={{ width: 110 }}>Rate (₹)</th>
                <th style={{ width: 100 }}>Disc (₹)</th>
                <th style={{ width: 110 }}>Amount (₹)</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._tempId}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: '12px' }}>{idx + 1}</td>
                  <td>
                    <input
                      className="form-control input-ocean"
                      list={`prod-list-${item._tempId}`}
                      value={item.description}
                      onChange={e => {
                        updateItem(item._tempId, 'description', e.target.value);
                        selectProduct(item._tempId, e.target.value);
                      }}
                      placeholder="Select or type product..."
                      style={{ fontSize: '0.85rem' }}
                    />
                    <datalist id={`prod-list-${item._tempId}`}>
                      {products.map(p => <option key={p._id} value={p.name} />)}
                    </datalist>
                  </td>
                  <td>
                    <input type="number" min="0.1" step="0.1" className="form-control input-ocean" value={item.quantity}
                      onChange={e => updateItem(item._tempId, 'quantity', e.target.value)}
                      style={{ fontSize: '0.85rem' }} />
                  </td>
                  <td>
                    <select className="form-select input-ocean" value={item.pack} onChange={e => updateItem(item._tempId, 'pack', e.target.value)} style={{ fontSize: '0.85rem' }}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01" className="form-control input-ocean" value={item.rate}
                      onChange={e => updateItem(item._tempId, 'rate', e.target.value)}
                      style={{ fontSize: '0.85rem' }} />
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01" className="form-control input-ocean" value={item.discount}
                      onChange={e => updateItem(item._tempId, 'discount', e.target.value)}
                      style={{ fontSize: '0.85rem' }} />
                  </td>
                  <td>
                    <div style={{
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 8, padding: '8px 12px', fontWeight: 700, color: 'var(--gold-light)',
                      textAlign: 'right', fontSize: '0.9rem', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'flex-end'
                    }}>
                      {((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0) - (parseFloat(item.discount) || 0)).toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <button onClick={() => removeItem(item._tempId)} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--coral)', borderRadius: 6, padding: '6px 10px' }}>
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="row justify-content-end mt-4">
          <div className="col-md-4">
            <div style={{ background: 'rgba(4,31,59,0.6)', border: '1px solid var(--glass-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div className="d-flex justify-content-between p-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="d-flex justify-content-between p-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Discount</span>
                  <span style={{ color: 'var(--coral)' }}>-₹{totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between p-3" style={{ background: 'rgba(6,182,212,0.1)' }}>
                <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, color: 'var(--ocean-glow)' }}>GRAND TOTAL</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)' }}>
                  ₹{totals.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="glass-card p-4 mb-4">
        <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Notes / Remarks</label>
        <textarea name="notes" className="form-control input-ocean" rows="2" value={header.notes} onChange={handleHeaderChange} placeholder="Optional notes..." />
      </div>

      <div className="d-flex gap-2">
        <button className="btn-ocean btn" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="bi bi-floppy me-2" />Save Invoice</>}
        </button>
      </div>
    </div>
  );
};

/* ─── Print-ready Invoice View ───────────────────────────────────────────────── */
export const InvoicePrintView = ({ invoice, printMode = false }) => {
  const base = printMode ? { fontFamily: 'Arial, sans-serif', color: 'black', background: 'white', padding: '20px' } : {};
  const textSecondary = printMode ? '#555' : 'var(--text-secondary)';

  return (
    <div style={base}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: printMode ? '2px solid #000' : '1px solid var(--glass-border)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: printMode ? '2.5rem' : '3rem' }}>🐡</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: printMode ? '1.4rem' : '1.6rem', color: printMode ? 'black' : 'var(--ocean-foam)', letterSpacing: 2 }}>MUTHUPANDI FISH FARM</div>
            <div style={{ fontSize: '0.82rem', color: textSecondary }}>6/201 ITI Colony, Aathikulam, K.Pudur - Madurai 7 Tamilnadu</div>
            <div style={{ fontSize: '0.82rem', color: textSecondary }}>Contact: 9842186330 &nbsp;|&nbsp; 9842886330</div>
          </div>
          <div style={{ fontSize: printMode ? '2.5rem' : '3rem' }}>🐉</div>
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: 4, color: printMode ? 'black' : 'var(--ocean-glow)', textTransform: 'uppercase' }}>INVOICE</div>
      </div>

      {/* Buyer & Invoice Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 6, color: textSecondary }}>BUYER AND ADDRESS</div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{invoice.buyerName}</div>
          {invoice.buyerAddress && <div style={{ fontSize: '0.85rem', color: textSecondary }}>{invoice.buyerAddress}</div>}
          {invoice.buyerPhone && <div style={{ fontSize: '0.85rem', color: textSecondary }}>📞 {invoice.buyerPhone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', marginBottom: 4 }}><span style={{ color: textSecondary }}>INVOICE DATE:</span> <strong>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></div>
          <div style={{ fontSize: '0.85rem', marginBottom: 4 }}><span style={{ color: textSecondary }}>INVOICE NO:</span> <strong style={{ color: printMode ? 'black' : 'var(--ocean-glow)' }}>{invoice.invoiceNo}</strong></div>
          <div style={{ fontSize: '0.85rem', marginBottom: 4 }}><span style={{ color: textSecondary }}>STATE:</span> <strong>{invoice.state}</strong></div>
          <div style={{ fontSize: '0.85rem', marginBottom: 4 }}><span style={{ color: textSecondary }}>STATE CODE:</span> <strong>{invoice.stateCode}</strong></div>
          <div style={{ fontSize: '0.85rem' }}><span style={{ color: textSecondary }}>GSTIN:</span> <strong>{invoice.gstin}</strong></div>
        </div>
      </div>

      {/* Items Table */}
      <table className={printMode ? 'print-table' : 'table table-ocean invoice-table'} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <thead>
          <tr>
            {['Sl.No', 'Description of Goods', 'Quantity', 'Pack', 'Rate', 'Disc', 'Amount'].map(h => (
              <th key={h} style={{ border: printMode ? '1px solid #000' : 'none', padding: '10px 12px', fontWeight: 700, fontSize: '0.8rem', textAlign: h === 'Amount' || h === 'Rate' || h === 'Disc' ? 'right' : 'left', background: printMode ? '#f0f0f0' : 'rgba(14,116,144,0.3)', color: printMode ? 'black' : 'var(--ocean-foam)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, i) => (
            <tr key={i}>
              <td style={{ border: printMode ? '1px solid #000' : 'none', borderBottom: printMode ? undefined : '1px solid var(--glass-border)', padding: '10px 12px', fontSize: '0.85rem', color: printMode ? 'black' : 'var(--text-secondary)' }}>{item.slNo || i + 1}</td>
              <td style={{ border: printMode ? '1px solid #000' : 'none', borderBottom: printMode ? undefined : '1px solid var(--glass-border)', padding: '10px 12px', fontWeight: 600, fontSize: '0.85rem' }}>{item.description}</td>
              <td style={{ border: printMode ? '1px solid #000' : 'none', borderBottom: printMode ? undefined : '1px solid var(--glass-border)', padding: '10px 12px', textAlign: 'right', fontSize: '0.85rem' }}>{item.quantity}</td>
              <td style={{ border: printMode ? '1px solid #000' : 'none', borderBottom: printMode ? undefined : '1px solid var(--glass-border)', padding: '10px 12px', fontSize: '0.85rem' }}>{item.pack}</td>
              <td style={{ border: printMode ? '1px solid #000' : 'none', borderBottom: printMode ? undefined : '1px solid var(--glass-border)', padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>{Number(item.rate).toFixed(2)}</td>
              <td style={{ border: printMode ? '1px solid #000' : 'none', borderBottom: printMode ? undefined : '1px solid var(--glass-border)', padding: '10px 12px', textAlign: 'right', fontSize: '0.85rem', color: item.discount > 0 ? (printMode ? 'red' : 'var(--coral)') : undefined }}>{Number(item.discount || 0).toFixed(2)}</td>
              <td style={{ border: printMode ? '1px solid #000' : 'none', borderBottom: printMode ? undefined : '1px solid var(--glass-border)', padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: printMode ? 'black' : 'var(--gold-light)' }}>{Number(item.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="6" style={{ border: printMode ? '1px solid #000' : 'none', borderTop: printMode ? undefined : '2px solid var(--glass-border)', padding: '12px', fontWeight: 800, fontSize: '1rem', textAlign: 'right', color: printMode ? 'black' : 'var(--ocean-glow)' }}>GRAND TOTAL</td>
            <td style={{ border: printMode ? '1px solid #000' : 'none', borderTop: printMode ? undefined : '2px solid var(--glass-border)', padding: '12px', textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: printMode ? 'black' : 'var(--gold)' }}>₹{Number(invoice.grandTotal).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && (
        <div style={{ fontSize: '0.82rem', color: textSecondary, marginTop: 12 }}>
          <strong>Notes:</strong> {invoice.notes}
        </div>
      )}

      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: textSecondary }}>
        <div>Buyer's Signature: ___________________</div>
        <div>Authorized Signature: ___________________</div>
      </div>
    </div>
  );
};

export default CreateInvoice;
