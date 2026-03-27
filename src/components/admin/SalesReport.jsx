// src/components/admin/SalesReport.jsx
import React, { useState, useRef } from 'react';
import { invoiceAPI } from '../../services/api';

const PERIODS = [
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom Range', value: 'custom' },
];

const ROWS_PER_PAGE = 20;

/* ── Generate A4 sales report HTML for print/PDF ── */
const generateSalesReportHTML = (data, period, startDate, endDate) => {
  const invoices = data.invoices || [];
  const pages = [];
  for (let i = 0; i < invoices.length; i += ROWS_PER_PAGE) {
    pages.push(invoices.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const totalPages = pages.length;
  const generatedDate = new Date().toLocaleDateString('en-IN');
  const periodLabel = period !== 'custom' ? period.toUpperCase() : `${startDate} to ${endDate}`;

  const pagesHTML = pages.map((pageInvoices, pageIndex) => {
    const isLastPage = pageIndex === totalPages - 1;
    const pageNum = pageIndex + 1;

    const emptyRowsCount = Math.max(0, ROWS_PER_PAGE - pageInvoices.length);

    const rowsHTML = pageInvoices.map(inv => `
      <tr>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;text-align:right;">#${inv.invoiceNo}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;">${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;font-weight:600;">${inv.buyerName}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;text-align:right;">₹${Number(inv.subtotal || 0).toFixed(2)}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;text-align:right;">${inv.cgstAmount > 0 ? `₹${Number(inv.cgstAmount).toFixed(2)}` : '—'}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;text-align:right;">${inv.sgstAmount > 0 ? `₹${Number(inv.sgstAmount).toFixed(2)}` : '—'}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;text-align:right;font-weight:bold;">₹${Number(inv.netAmount || inv.grandTotal || 0).toFixed(2)}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;text-align:right;">₹${Number(inv.paidAmount || 0).toFixed(2)}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;text-align:right;color:${inv.balanceAmount > 0 ? '#c00' : '#006600'};">${inv.balanceAmount > 0 ? `₹${Number(inv.balanceAmount).toFixed(2)}` : '✓'}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:10px;text-align:center;">${inv.paymentStatus}</td>
      </tr>
    `).join('');

    const emptyRowsHTML = Array(emptyRowsCount).fill(null).map(() => `
      <tr>
        ${Array(10).fill('<td style="border:1px solid #000;padding:5px 6px;font-size:10px;">&nbsp;</td>').join('')}
      </tr>
    `).join('');

    const footerHTML = isLastPage ? `
      <tfoot>
        <tr style="background:#e8e8e8;font-weight:bold;">
          <td colspan="3" style="border:2px solid #000;padding:6px 8px;font-size:11px;">TOTAL (${data.count} invoices)</td>
          <td style="border:2px solid #000;padding:6px 8px;font-size:11px;text-align:right;">₹${Number(data.totalSales - data.totalGst).toFixed(2)}</td>
          <td style="border:2px solid #000;padding:6px 8px;font-size:11px;text-align:right;">₹${Number(data.totalCgst).toFixed(2)}</td>
          <td style="border:2px solid #000;padding:6px 8px;font-size:11px;text-align:right;">₹${Number(data.totalSgst).toFixed(2)}</td>
          <td style="border:2px solid #000;padding:6px 8px;font-size:12px;text-align:right;">₹${Number(data.totalSales).toFixed(2)}</td>
          <td style="border:2px solid #000;padding:6px 8px;font-size:11px;text-align:right;">₹${Number(data.totalPaid).toFixed(2)}</td>
          <td style="border:2px solid #000;padding:6px 8px;font-size:11px;text-align:right;color:#c00;">₹${Number(data.totalBalance).toFixed(2)}</td>
          <td style="border:2px solid #000;padding:6px 8px;"></td>
        </tr>
      </tfoot>
    ` : '';

    return `
      <div style="width:210mm;min-height:297mm;background:#fff;font-family:Arial,sans-serif;color:#000;padding:10mm;box-sizing:border-box;page-break-after:${isLastPage ? 'auto' : 'always'};">
        <!-- Header with 3 images -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <img src="../../assets/fishImg1.jpg" alt="" style="width:70px;height:60px;object-fit:cover;border:1px solid #ccc;" onerror="this.style.display='none'" />
          <div style="text-align:center;flex:1;padding:0 10px;">
            <img src="../../assets/BannerImg.jpeg" alt="Banner" style="max-width:180px;max-height:50px;object-fit:contain;display:block;margin:0 auto 3px;" onerror="this.style.display='none'" />
            <div style="font-weight:900;font-size:15px;letter-spacing:2px;">MUTHUPANDI FISH FARM</div>
            <div style="font-size:10px;color:#555;">6/201 ITI COLONY, AATHIKULAM, K.PUDUR - MADURAI 7 TAMILNADU</div>
            <div style="font-size:10px;color:#555;">Contact 9842186330 &nbsp; 9842886330</div>
          </div>
          <img src="../../assets/fishImg2.jpg" alt="" style="width:70px;height:60px;object-fit:cover;border:1px solid #ccc;" onerror="this.style.display='none'" />
        </div>

        <div style="border:2px solid #000;">
          <div style="text-align:center;padding:5px;border-bottom:2px solid #000;font-weight:900;font-size:13px;letter-spacing:4px;background:#f0f0f0;">
            SALES REPORT
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #000;font-size:10px;">
            <span><strong>Period:</strong> ${periodLabel}</span>
            <span><strong>Generated:</strong> ${generatedDate}</span>
            <span><strong>Page ${pageNum} of ${totalPages}</strong></span>
          </div>

          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;text-align:right;width:50px;">Inv No</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;width:65px;">Date</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;">Buyer</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;text-align:right;width:70px;">Subtotal</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;text-align:right;width:55px;">CGST</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;text-align:right;width:55px;">SGST</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;text-align:right;width:75px;">Net Amt</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;text-align:right;width:70px;">Paid</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;text-align:right;width:70px;">Balance</th>
                <th style="border:1px solid #000;padding:6px 8px;font-size:10px;text-align:center;width:55px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
              ${emptyRowsHTML}
            </tbody>
            ${footerHTML}
          </table>

          ${isLastPage ? `
            <!-- Summary box on last page -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:2px solid #000;">
              ${[
                ['Total Sales', `₹${Number(data.totalSales).toFixed(2)}`],
                ['Total GST', `₹${Number(data.totalGst).toFixed(2)}`],
                ['Amount Collected', `₹${Number(data.totalPaid).toFixed(2)}`],
                ['CGST', `₹${Number(data.totalCgst).toFixed(2)}`],
                ['SGST', `₹${Number(data.totalSgst).toFixed(2)}`],
                ['Balance Pending', `₹${Number(data.totalBalance).toFixed(2)}`],
              ].map(([label, value]) => `
                <div style="padding:8px 12px;border-right:1px solid #ccc;border-bottom:1px solid #ccc;">
                  <div style="font-size:9px;color:#555;">${label}</div>
                  <div style="font-size:12px;font-weight:bold;">${value}</div>
                </div>
              `).join('')}
            </div>
            <div style="text-align:center;padding:6px;border-top:1px solid #000;font-size:9px;color:#555;">
              This is a Computer Generated Sales Report
            </div>
          ` : `
            <div style="text-align:right;padding:6px 12px;border-top:1px solid #000;font-size:10px;color:#555;">
              Continued on next page... (Page ${pageNum} of ${totalPages})
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sales Report - Muthupandi Fish Farm</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; }
    @media print {
      @page { size: A4; margin: 0; }
      body { margin: 0; }
    }
  </style>
</head>
<body>${pagesHTML}</body>
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

  const handlePrint = () => {
    if (!data) return;
    const htmlContent = generateSalesReportHTML(data, period, startDate, endDate);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { showToast('Please allow popups to print', 'error'); return; }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 800);
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

          {/* Invoice Table (screen view) */}
          <div className="glass-card overflow-hidden">
            <div className="p-3 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <h6 style={{ margin: 0, color: 'var(--ocean-glow)' }}>Invoice Details — {data.count} records</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-ocean table-hover mb-0" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Buyer</th>
                    <th className="text-end">Subtotal</th>
                    <th className="text-end">CGST</th>
                    <th className="text-end">SGST</th>
                    <th className="text-end">Net Amount</th>
                    <th className="text-end">Paid</th>
                    <th className="text-end">Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.length === 0 ? (
                    <tr><td colSpan="10" className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>No invoices for this period</td></tr>
                  ) : data.invoices.map(inv => (
                    <tr key={inv._id}>
                      <td style={{ color: 'var(--ocean-glow)', fontWeight: 700 }}>#{inv.invoiceNo}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.buyerName}</div>
                        {inv.buyerPhone && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{inv.buyerPhone}</div>}
                      </td>
                      <td className="text-end">₹{Number(inv.subtotal || 0).toLocaleString('en-IN')}</td>
                      <td className="text-end" style={{ color: 'var(--ocean-light)' }}>{inv.cgstAmount > 0 ? `₹${Number(inv.cgstAmount).toFixed(2)}` : '—'}</td>
                      <td className="text-end" style={{ color: 'var(--ocean-light)' }}>{inv.sgstAmount > 0 ? `₹${Number(inv.sgstAmount).toFixed(2)}` : '—'}</td>
                      <td className="text-end" style={{ color: 'var(--gold-light)', fontWeight: 700 }}>₹{Number(inv.netAmount || inv.grandTotal || 0).toLocaleString('en-IN')}</td>
                      <td className="text-end" style={{ color: '#4ade80' }}>₹{Number(inv.paidAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="text-end" style={{ color: inv.balanceAmount > 0 ? '#fca5a5' : '#4ade80' }}>
                        {inv.balanceAmount > 0 ? `₹${Number(inv.balanceAmount).toLocaleString('en-IN')}` : '✓'}
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, background: `${statusColor(inv.paymentStatus)}22`, color: statusColor(inv.paymentStatus), border: `1px solid ${statusColor(inv.paymentStatus)}44` }}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'rgba(6,182,212,0.05)' }}>
                    <td colSpan="3" style={{ fontWeight: 800, color: 'var(--ocean-glow)', padding: '12px' }}>TOTAL ({data.count} invoices)</td>
                    <td className="text-end" style={{ fontWeight: 700, padding: '12px' }}>₹{Number(data.totalSales - data.totalGst).toLocaleString('en-IN')}</td>
                    <td className="text-end" style={{ fontWeight: 700, color: 'var(--ocean-light)', padding: '12px' }}>₹{Number(data.totalCgst).toLocaleString('en-IN')}</td>
                    <td className="text-end" style={{ fontWeight: 700, color: 'var(--ocean-light)', padding: '12px' }}>₹{Number(data.totalSgst).toLocaleString('en-IN')}</td>
                    <td className="text-end" style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '1rem', padding: '12px' }}>₹{Number(data.totalSales).toLocaleString('en-IN')}</td>
                    <td className="text-end" style={{ fontWeight: 700, color: '#4ade80', padding: '12px' }}>₹{Number(data.totalPaid).toLocaleString('en-IN')}</td>
                    <td className="text-end" style={{ fontWeight: 700, color: '#fca5a5', padding: '12px' }}>₹{Number(data.totalBalance).toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
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