// src/components/admin/SalesReport.jsx
import React, { useState } from 'react';
import { invoiceAPI } from '../../services/api';

import fishImg1 from '../../assets/fishImg1.jpg';
import fishImg2 from '../../assets/fishImg2.jpg';
import bannerImg from '../../assets/BannerImg.jpeg';

const PERIODS = [
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom Range', value: 'custom' },
];

/* ── Convert image to base64 ── */
const imageToBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
};

/* ── Dot-matrix style Sales Report PDF — grouped by bill ── */
const generateSalesReportHTML = async (data, period, startDate, endDate) => {
  const [fish1B64, fish2B64, bannerB64] = await Promise.all([
    imageToBase64(fishImg1),
    imageToBase64(fishImg2),
    imageToBase64(bannerImg),
  ]);

  const invoices = data.invoices || [];
  const generatedDate = new Date().toLocaleDateString('en-IN');
  const generatedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const periodLabel = period !== 'custom' ? period.toUpperCase() : `${startDate} to ${endDate}`;

  // Build all bill rows as HTML blocks
  const billsHTML = invoices.map((inv, idx) => {
    const items = inv.items || [];
    const itemRowsHTML = items.map(item => `
      <tr>
        <td style="padding:1px 6px;font-size:10px;border-bottom:1px dotted #bbb;">&nbsp;&nbsp;&nbsp;${item.description || ''}</td>
        <td style="padding:1px 6px;font-size:10px;border-bottom:1px dotted #bbb;text-align:right;">${Number(item.rate || 0).toFixed(2)}</td>
        <td style="padding:1px 6px;font-size:10px;border-bottom:1px dotted #bbb;text-align:right;">${item.quantity || 0}</td>
        <td style="padding:1px 6px;font-size:10px;border-bottom:1px dotted #bbb;text-align:center;">${item.pack || ''}</td>
        <td style="padding:1px 6px;font-size:10px;border-bottom:1px dotted #bbb;text-align:right;font-weight:bold;">${Number(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const netAmt = Number(inv.netAmount || inv.grandTotal || 0);
    const paidAmt = Number(inv.paidAmount || 0);
    const balAmt = Number(inv.balanceAmount || 0);

    return `
      <tr style="background:${idx % 2 === 0 ? '#f9f9f9' : '#fff'};">
        <td colspan="8" style="padding:0;border-bottom:2px solid #555;">
          <table style="width:100%;border-collapse:collapse;">
            <!-- Bill Header Row -->
            <tr style="background:#333;color:#fff;">
              <td style="padding:3px 6px;font-size:10px;font-weight:bold;width:55px;">#${inv.invoiceNo}</td>
              <td style="padding:3px 6px;font-size:10px;">${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
              <td style="padding:3px 6px;font-size:10px;font-weight:bold;">${inv.buyerName}</td>
              ${inv.buyerPhone ? `<td style="padding:3px 6px;font-size:10px;color:#ccc;">${inv.buyerPhone}</td>` : '<td></td>'}
              <td style="padding:3px 6px;font-size:10px;text-align:right;">${items.length} item${items.length !== 1 ? 's' : ''}</td>
              <td style="padding:3px 6px;font-size:10px;text-align:right;font-weight:bold;">₹${netAmt.toFixed(2)}</td>
              <td style="padding:3px 6px;font-size:10px;text-align:right;color:${balAmt > 0 ? '#ff6b6b' : '#90ee90'};">
                ${balAmt > 0 ? `BAL ₹${balAmt.toFixed(2)}` : '✓ PAID'}
              </td>
              <td style="padding:3px 6px;font-size:10px;text-align:center;">
                <span style="background:${inv.paymentStatus === 'Paid' ? '#2d6a4f' : inv.paymentStatus === 'Partial' ? '#7d4e00' : '#7d0000'};color:#fff;padding:1px 6px;border-radius:3px;font-size:9px;">
                  ${inv.paymentStatus}
                </span>
              </td>
            </tr>
            <!-- Product Lines -->
            <tr>
              <td colspan="8" style="padding:0;">
                <table style="width:100%;border-collapse:collapse;background:#fff;">
                  <tr style="background:#e8e8e8;">
                    <th style="padding:2px 6px;font-size:9px;text-align:left;font-style:italic;">Product</th>
                    <th style="padding:2px 6px;font-size:9px;text-align:right;width:60px;">Rate</th>
                    <th style="padding:2px 6px;font-size:9px;text-align:right;width:40px;">Qty</th>
                    <th style="padding:2px 6px;font-size:9px;text-align:center;width:40px;">Unit</th>
                    <th style="padding:2px 6px;font-size:9px;text-align:right;width:65px;">Amount</th>
                  </tr>
                  ${itemRowsHTML}
                  <!-- Bill summary footer -->
                  <tr style="background:#f0f0f0;border-top:1px solid #aaa;">
                    <td colspan="3" style="padding:2px 6px;font-size:9px;color:#555;">
                      ${inv.cgstAmount > 0 ? `CGST: ₹${Number(inv.cgstAmount).toFixed(2)}` : ''}
                      ${inv.sgstAmount > 0 ? ` | SGST: ₹${Number(inv.sgstAmount).toFixed(2)}` : ''}
                      ${inv.transport > 0 ? ` | Transport: ₹${Number(inv.transport).toFixed(2)}` : ''}
                    </td>
                    <td style="padding:2px 6px;font-size:9px;text-align:right;font-weight:bold;">Net:</td>
                    <td style="padding:2px 6px;font-size:10px;text-align:right;font-weight:bold;">₹${netAmt.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  const headerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      ${fish1B64 ? `<img src="${fish1B64}" alt="" style="width:70px;height:60px;object-fit:cover;border:1px solid #ccc;" />` : '<div style="width:70px;"></div>'}
      <div style="text-align:center;flex:1;padding:0 10px;">
        ${bannerB64 ? `<img src="${bannerB64}" alt="Banner" style="max-width:200px;max-height:55px;object-fit:contain;display:block;margin:0 auto 4px;" />` : ''}
        <div style="font-weight:900;font-size:16px;letter-spacing:2px;">MUTHUPANDI FISH FARM</div>
        <div style="font-size:10px;color:#555;">6/201 ITI COLONY, AATHIKULAM, K.PUDUR - MADURAI 7 TAMILNADU</div>
        <div style="font-size:10px;color:#555;">Contact 9842186330 &nbsp; 9842886330</div>
      </div>
      ${fish2B64 ? `<img src="${fish2B64}" alt="" style="width:70px;height:60px;object-fit:cover;border:1px solid #ccc;" />` : '<div style="width:70px;"></div>'}
    </div>
  `;

  const summaryHTML = `
    <div style="border:2px solid #000;margin-top:8px;">
      <div style="background:#333;color:#fff;text-align:center;padding:4px;font-weight:900;font-size:11px;letter-spacing:3px;">SUMMARY</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);">
        ${[
          ['Total Invoices', data.count],
          ['Total Sales', `₹${Number(data.totalSales).toFixed(2)}`],
          ['Total GST', `₹${Number(data.totalGst).toFixed(2)}`],
          ['CGST', `₹${Number(data.totalCgst).toFixed(2)}`],
          ['SGST', `₹${Number(data.totalSgst).toFixed(2)}`],
          ['Amount Collected', `₹${Number(data.totalPaid).toFixed(2)}`],
          ['Balance Pending', `₹${Number(data.totalBalance).toFixed(2)}`],
        ].map(([label, value]) => `
          <div style="padding:6px 10px;border-right:1px solid #ccc;border-bottom:1px solid #ccc;">
            <div style="font-size:9px;color:#555;">${label}</div>
            <div style="font-size:12px;font-weight:bold;">${value}</div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;padding:5px;font-size:9px;color:#555;border-top:1px solid #ccc;">
        Generated: ${generatedDate} ${generatedTime} &nbsp;|&nbsp; This is a Computer Generated Sales Report
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sales Report - Muthupandi Fish Farm</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; font-family: 'Courier New', Courier, monospace; }
    @media print {
      @page { size: A4; margin: 8mm; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div style="width:210mm;background:#fff;font-family:'Courier New',Courier,monospace;color:#000;padding:8mm;box-sizing:border-box;">
    ${headerHTML}
    <div style="border:2px solid #000;">
      <!-- Title bar -->
      <div style="text-align:center;padding:5px;border-bottom:2px solid #000;font-weight:900;font-size:14px;letter-spacing:5px;background:#f0f0f0;">
        SALES REPORT
      </div>
      <!-- Period bar -->
      <div style="display:flex;justify-content:space-between;padding:4px 10px;border-bottom:2px solid #000;font-size:10px;background:#e8e8e8;">
        <span><strong>PERIOD:</strong> ${periodLabel}</span>
        <span><strong>TOTAL BILLS:</strong> ${data.count}</span>
        <span><strong>GENERATED:</strong> ${generatedDate} ${generatedTime}</span>
      </div>
      <!-- Column header for bills -->
      <div style="display:flex;background:#555;color:#fff;padding:3px 6px;font-size:10px;font-weight:bold;border-bottom:1px solid #000;">
        <span style="width:55px;">INV NO</span>
        <span style="width:70px;">DATE</span>
        <span style="flex:1;">BUYER</span>
        <span style="width:90px;">PHONE</span>
        <span style="width:50px;text-align:right;">ITEMS</span>
        <span style="width:80px;text-align:right;">NET AMT</span>
        <span style="width:90px;text-align:right;">BALANCE</span>
        <span style="width:55px;text-align:center;">STATUS</span>
      </div>
      <!-- Bills grouped -->
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${billsHTML}
        </tbody>
      </table>
      <!-- Totals row -->
      <div style="display:flex;background:#222;color:#fff;padding:5px 6px;font-size:11px;font-weight:bold;border-top:2px solid #000;">
        <span style="flex:1;">TOTAL (${data.count} Bills)</span>
        <span style="width:80px;text-align:right;">₹${Number(data.totalSales).toFixed(2)}</span>
        <span style="width:90px;text-align:right;color:#ffaaaa;">₹${Number(data.totalBalance).toFixed(2)}</span>
        <span style="width:55px;"></span>
      </div>
    </div>
    ${summaryHTML}
  </div>
</body>
</html>`;
};

const SalesReport = () => {
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (period !== 'custom') params.period = period;
      else { if (startDate) params.startDate = startDate; if (endDate) params.endDate = endDate; }
      const res = await invoiceAPI.getReport(params);
      setData(res.data.data);
    } catch { showToast('Error loading report', 'error'); }
    setLoading(false);
  };

  const handlePrint = async () => {
    if (!data) return;
    const htmlContent = await generateSalesReportHTML(data, period, startDate, endDate);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { showToast('Please allow popups to print', 'error'); return; }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1200);
  };

  const handleExcelExport = () => {
    if (!data) return;
    const rows = [
      ['MUTHUPANDI FISH FARM - SALES REPORT'],
      ['Period:', period !== 'custom' ? period : `${startDate} to ${endDate}`],
      ['Generated:', new Date().toLocaleDateString('en-IN')],
      [],
      ['Invoice No', 'Date', 'Buyer', 'Phone', 'Subtotal', 'CGST', 'SGST', 'Total GST', 'Transport', 'Net Amount', 'Paid', 'Balance', 'Status'],
      ...data.invoices.map(inv => [
        inv.invoiceNo,
        new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
        inv.buyerName,
        inv.buyerPhone || '',
        inv.subtotal || 0,
        inv.cgstAmount || 0,
        inv.sgstAmount || 0,
        inv.totalGst || 0,
        inv.transport || 0,
        inv.netAmount || inv.grandTotal || 0,
        inv.paidAmount || 0,
        inv.balanceAmount || 0,
        inv.paymentStatus
      ]),
      [],
      ['TOTALS', '', '', '', '', '', '', data.totalGst, '', data.totalSales, data.totalPaid, data.totalBalance, ''],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `SalesReport_${period}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const statusColor = s => ({ Paid: '#4ade80', Pending: '#fbbf24', Partial: '#fb923c' }[s] || '#94a3b8');

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600 }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>Sales Report</h5>
          <small style={{ color: 'var(--text-secondary)' }}>Filter and export sales data with GST breakdown</small>
        </div>
        {data && (
          <div className="d-flex gap-2">
            <button className="btn btn-sm" onClick={handlePrint} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--coral)' }}>
              <i className="bi bi-file-earmark-pdf me-1" />Print / Save PDF
            </button>
            <button className="btn btn-sm" onClick={handleExcelExport} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green-sea)' }}>
              <i className="bi bi-file-earmark-excel me-1" />Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <div className="glass-card p-4 mb-4">
        <h6 style={{ color: 'var(--ocean-glow)', marginBottom: 16 }}><i className="bi bi-funnel me-2" />Filter Report</h6>
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginBottom: 8 }}>Period</label>
            <div className="d-flex gap-2 flex-wrap">
              {PERIODS.map(p => (
                <button key={p.value} className="btn btn-sm" onClick={() => setPeriod(p.value)} style={{
                  background: period === p.value ? 'rgba(6,182,212,0.2)' : 'var(--glass)',
                  border: `1px solid ${period === p.value ? 'rgba(6,182,212,0.5)' : 'var(--glass-border)'}`,
                  color: period === p.value ? 'var(--ocean-light)' : 'var(--text-secondary)',
                  fontSize: '0.8rem', padding: '6px 14px', borderRadius: 8
                }}>{p.label}</button>
              ))}
            </div>
          </div>
          {period === 'custom' && (
            <div className="col-md-4">
              <div className="d-flex gap-2">
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>From</label>
                  <input type="date" className="form-control input-ocean form-control-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>To</label>
                  <input type="date" className="form-control input-ocean form-control-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <div className="col-md-3">
            <button className="btn-ocean btn w-100" onClick={loadReport} disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Loading...</> : <><i className="bi bi-graph-up me-2" />Generate Report</>}
            </button>
          </div>
        </div>
      </div>

      {/* Report */}
      {data && (
        <>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Sales', value: `₹${Number(data.totalSales).toLocaleString('en-IN')}`, color: 'var(--gold)', icon: 'bi-currency-rupee', bg: 'rgba(245,158,11,0.1)' },
              { label: 'CGST Collected', value: `₹${Number(data.totalCgst).toLocaleString('en-IN')}`, color: 'var(--ocean-glow)', icon: 'bi-percent', bg: 'rgba(34,211,238,0.1)' },
              { label: 'SGST Collected', value: `₹${Number(data.totalSgst).toLocaleString('en-IN')}`, color: 'var(--ocean-light)', icon: 'bi-percent', bg: 'rgba(6,182,212,0.1)' },
              { label: 'Total GST', value: `₹${Number(data.totalGst).toLocaleString('en-IN')}`, color: '#a78bfa', icon: 'bi-receipt', bg: 'rgba(167,139,250,0.1)' },
              { label: 'Amount Collected', value: `₹${Number(data.totalPaid).toLocaleString('en-IN')}`, color: '#4ade80', icon: 'bi-check-circle', bg: 'rgba(74,222,128,0.1)' },
              { label: 'Balance Pending', value: `₹${Number(data.totalBalance).toLocaleString('en-IN')}`, color: '#fca5a5', icon: 'bi-exclamation-circle', bg: 'rgba(252,165,165,0.1)' },
              { label: 'Total Invoices', value: data.count, color: 'var(--ocean-light)', icon: 'bi-file-text', bg: 'rgba(6,182,212,0.1)' },
            ].map(c => (
              <div key={c.label} className="col-6 col-md-3">
                <div className="glass-card p-3 d-flex align-items-center gap-3" style={{ background: c.bg }}>
                  <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: '1.4rem' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.label}</div>
                    <div style={{ color: c.color, fontWeight: 800, fontSize: '1rem' }}>{c.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Invoice Table — grouped by bill with products listed */}
          <div className="glass-card overflow-hidden">
            <div className="p-3 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <h6 style={{ margin: 0, color: 'var(--ocean-glow)' }}>Bills — {data.count} records</h6>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {data.invoices.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>No invoices for this period</div>
              ) : data.invoices.map(inv => (
                <div key={inv._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {/* Bill header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(6,182,212,0.07)', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--ocean-glow)', fontWeight: 800, fontSize: '0.9rem', minWidth: 60 }}>#{inv.invoiceNo}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', minWidth: 80 }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</span>
                    <span style={{ fontWeight: 700, color: 'var(--ocean-foam)', flex: 1 }}>{inv.buyerName}</span>
                    {inv.buyerPhone && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{inv.buyerPhone}</span>}
                    <span style={{ color: 'var(--gold-light)', fontWeight: 800, fontSize: '0.95rem' }}>₹{Number(inv.netAmount || inv.grandTotal || 0).toLocaleString('en-IN')}</span>
                    <span style={{ color: inv.balanceAmount > 0 ? '#fca5a5' : '#4ade80', fontSize: '0.8rem', fontWeight: 600 }}>
                      {inv.balanceAmount > 0 ? `Bal ₹${Number(inv.balanceAmount).toLocaleString('en-IN')}` : '✓ Paid'}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, background: `${statusColor(inv.paymentStatus)}22`, color: statusColor(inv.paymentStatus), border: `1px solid ${statusColor(inv.paymentStatus)}44` }}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                  {/* Product lines */}
                  {(inv.items || []).length > 0 && (
                    <div style={{ padding: '4px 16px 8px 32px' }}>
                      {(inv.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '3px 0', borderBottom: '1px dotted var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span style={{ flex: 1, color: 'var(--ocean-foam)' }}>{item.description}</span>
                          <span>Rate: <strong style={{ color: 'var(--ocean-light)' }}>₹{Number(item.rate || 0).toFixed(2)}</strong></span>
                          <span>Qty: <strong>{item.quantity}</strong> {item.pack}</span>
                          <span style={{ fontWeight: 700, color: 'var(--gold-light)' }}>₹{Number(item.amount || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '12px 16px', borderTop: '2px solid var(--glass-border)', background: 'rgba(6,182,212,0.05)', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>TOTAL ({data.count} bills)</span>
                <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.05rem' }}>₹{Number(data.totalSales).toLocaleString('en-IN')}</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>Paid: ₹{Number(data.totalPaid).toLocaleString('en-IN')}</span>
                <span style={{ color: '#fca5a5', fontWeight: 700 }}>Balance: ₹{Number(data.totalBalance).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="glass-card p-5 text-center" style={{ color: 'var(--text-secondary)' }}>
          <i className="bi bi-graph-up-arrow" style={{ fontSize: '3rem', color: 'var(--ocean-light)', display: 'block', marginBottom: 12 }} />
          <p>Select a period and click <strong style={{ color: 'var(--ocean-light)' }}>Generate Report</strong></p>
        </div>
      )}
    </div>
  );
};

export default SalesReport;
