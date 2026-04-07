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

/* ═══════════════════════════════════════════════════════════════════════════
   SALES REPORT PDF — Ledger / register style (matches handwritten image):

   Bill No.  2245-00/001  BUYERNAME  CITY          Net:₹xxx  Bal:₹xxx
    1. ITEM NAME          22 Nos    @100.00         400.00
    2. ANOTHER ITEM       10 Kg     @50.00          500.00
   -----------------------------------------------------------------------
   Bill No.  2245-00/002  BUYERNAME  CITY          Net:₹xxx  Bal:₹xxx
    1. ITEM NAME          ...
   -----------------------------------------------------------------------

   KEY RULES:
   - NO boxes / cards
   - Each bill is a compact ledger block separated by a dashed rule
   - Bill header: invoice# | date | buyer | city | Net | Bal/PAID
   - Items indented below, columnar: S.No | Name | Qty+Unit | @Rate | Amount
   - GST/transport as a small extra line if present
   - Ascending invoice order
═══════════════════════════════════════════════════════════════════════════ */
const generateSalesReportHTML = async (data, period, startDate, endDate) => {
  const [fish1B64, fish2B64, bannerB64] = await Promise.all([
    imageToBase64(fishImg1),
    imageToBase64(fishImg2),
    imageToBase64(bannerImg),
  ]);

  // ── Sort invoices ASCENDING ──
  const invoices = [...(data.invoices || [])].sort((a, b) => {
    const numA = parseInt(String(a.invoiceNo).replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(String(b.invoiceNo).replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  const generatedDate = new Date().toLocaleDateString('en-IN');
  const generatedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const periodLabel   = period !== 'custom' ? period.toUpperCase() : `${startDate} to ${endDate}`;

  /* ─────────────────────────────────────────────────────────────────────
     buildInvoiceBlock — ledger row style, no borders/boxes
  ───────────────────────────────────────────────────────────────────── */
  const buildInvoiceBlock = (inv, idx) => {
    const items    = inv.items || [];
    const netAmt   = Number(inv.netAmount || inv.grandTotal || 0);
    const balAmt   = Number(inv.balanceAmount || 0);
    const paidAmt  = Number(inv.paidAmount || 0);
    const isPaid   = inv.paymentStatus === 'Paid' || balAmt === 0;
    const isPartial = inv.paymentStatus === 'Partial';
    const buyerCity = inv.buyerCity || inv.city || inv.buyerAddress || '';

    const invoiceDate = new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });

    // Status text
    const statusText = isPaid
      ? '&#10003;PAID'
      : isPartial
        ? `Bal:&#8377;${balAmt.toFixed(0)}`
        : `Due:&#8377;${balAmt.toFixed(0)}`;
    const statusColor = isPaid ? '#1a7a3a' : isPartial ? '#a05000' : '#9b0000';

    // ── Bill header row ──
    // Layout: [Bill No.]  [Date]  [BuyerName]  [City]  ...  [Net ₹]  [Status]
    const headerRow = `
      <tr style="background:#f0f0f0;">
        <td colspan="5" style="
          padding: 3px 4px 3px 4px;
          font-size: 9px;
          font-weight: 900;
          color: #000;
          border-top: 1.5px solid #000;
          border-bottom: 1px solid #555;
          white-space: nowrap;
        ">
          <span style="font-size:9.5px;letter-spacing:0.5px;">Bill No.&nbsp;&nbsp;${inv.invoiceNo}</span>
          &nbsp;&nbsp;
          <span style="font-size:8.5px;color:#333;">${invoiceDate}</span>
          &nbsp;&nbsp;
          <span style="font-size:9px;font-weight:900;">${inv.buyerName}</span>
          ${inv.buyerPhone ? `&nbsp;<span style="font-size:8px;color:#444;">${inv.buyerPhone}</span>` : ''}
          ${buyerCity ? `&nbsp;&nbsp;<span style="font-size:8px;color:#333;">&#128205;${buyerCity}</span>` : ''}
          <span style="float:right;font-size:9px;font-weight:900;color:#000;">
            Net:&#8377;${netAmt.toFixed(0)}
            &nbsp;&nbsp;
            <span style="color:${statusColor};font-weight:900;">${statusText}</span>
          </span>
        </td>
      </tr>`;

    // ── Item rows ──
    const itemRows = items.map((item, i) => {
      const desc   = (item.description || '').substring(0, 28);
      const qty    = item.quantity || 0;
      const unit   = item.pack || '';
      const rate   = Number(item.rate || 0).toFixed(2);
      const amount = Number(item.amount || 0).toFixed(2);
      return `
        <tr>
          <td style="padding:2px 3px 2px 10px;font-size:8.5px;color:#555;text-align:right;width:18px;">${i + 1}.</td>
          <td style="padding:2px 4px;font-size:9px;font-weight:700;color:#000;min-width:100px;">${desc}</td>
          <td style="padding:2px 6px;font-size:9px;font-weight:700;color:#000;text-align:right;white-space:nowrap;">${qty}${unit ? '&nbsp;' + unit : ''}</td>
          <td style="padding:2px 6px;font-size:9px;font-weight:700;color:#333;text-align:right;white-space:nowrap;">@${rate}</td>
          <td style="padding:2px 8px 2px 4px;font-size:9px;font-weight:900;color:#000;text-align:right;white-space:nowrap;">${amount}</td>
        </tr>`;
    }).join('');

    // ── GST / transport extras ──
    const extraParts = [];
    if (Number(inv.cgstAmount) > 0 || Number(inv.sgstAmount) > 0) {
      extraParts.push(`CGST: &#8377;${Number(inv.cgstAmount||0).toFixed(2)}&nbsp;&nbsp;SGST: &#8377;${Number(inv.sgstAmount||0).toFixed(2)}`);
    }
    if (Number(inv.transport) > 0) {
      extraParts.push(`Transport: &#8377;${Number(inv.transport||0).toFixed(2)}`);
    }

    const extraRow = extraParts.length ? `
      <tr>
        <td></td>
        <td colspan="4" style="padding:1px 4px 2px 4px;font-size:8px;font-weight:700;color:#555;font-style:italic;">
          ${extraParts.join('&nbsp;&nbsp;|&nbsp;&nbsp;')}
        </td>
      </tr>` : '';

    // ── Total row ──
    const totalRow = `
      <tr style="border-top:1px solid #aaa;">
        <td></td>
        <td colspan="3" style="padding:2px 4px;font-size:8.5px;font-weight:900;color:#555;text-align:right;">
          ${items.length} item${items.length !== 1 ? 's' : ''}
          ${paidAmt > 0 && !isPaid ? `&nbsp;&nbsp;Paid: &#8377;${paidAmt.toFixed(2)}` : ''}
        </td>
        <td style="padding:2px 8px 2px 4px;font-size:9.5px;font-weight:900;color:#000;text-align:right;border-top:1px solid #000;">
          &#8377;${netAmt.toFixed(2)}
        </td>
      </tr>`;

    return headerRow + itemRows + extraRow + totalRow;
  };

  // Build all invoice rows
  const allRows = invoices.map((inv, idx) => buildInvoiceBlock(inv, idx)).join('');

  /* ── Shop header ── */
  const headerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;border-bottom:2px double #000;padding-bottom:5px;">
      ${fish1B64 ? `<img src="${fish1B64}" alt="" style="width:70px;height:60px;object-fit:contain;" />` : '<div style="width:70px;"></div>'}
      <div style="text-align:center;flex:1;padding:0 8px;">
        ${bannerB64 ? `<img src="${bannerB64}" alt="Banner" style="max-width:300px;max-height:70px;object-fit:contain;display:block;margin:0 auto 3px;" />` : ''}
        <div style="font-weight:900;font-size:15px;letter-spacing:2px;color:#000;">MUTHUPANDI FISH FARM</div>
        <div style="font-size:9px;font-weight:700;color:#000;">6/201 ITI COLONY, AATHIKULAM, K.PUDUR - MADURAI 7, TAMILNADU</div>
        <div style="font-size:9px;font-weight:700;color:#000;">Contact: 9842186330 &nbsp; 9842886330</div>
      </div>
      ${fish2B64 ? `<img src="${fish2B64}" alt="" style="width:70px;height:60px;object-fit:contain;" />` : '<div style="width:70px;"></div>'}
    </div>`;

  /* ── Report title bar ── */
  const titleBarHTML = `
    <div style="border:1.5px solid #000;margin-bottom:5px;">
      <div style="background:#000;color:#fff;text-align:center;padding:3px;font-weight:900;font-size:12px;letter-spacing:5px;">SALES REPORT</div>
      <div style="display:flex;justify-content:space-between;padding:3px 10px;font-size:9px;font-weight:900;color:#000;background:#e8e8e8;border-top:1px solid #000;">
        <span>PERIOD: ${periodLabel}</span>
        <span>TOTAL BILLS: ${data.count}</span>
        <span>GENERATED: ${generatedDate} ${generatedTime}</span>
      </div>
    </div>`;

  /* ── Column header for the ledger table ── */
  const tableHeaderHTML = `
    <tr style="background:#ddd;">
      <th style="padding:3px 3px 3px 10px;font-size:8px;font-weight:900;color:#000;text-align:right;width:18px;">#</th>
      <th style="padding:3px 4px;font-size:8px;font-weight:900;color:#000;text-align:left;">ITEM DESCRIPTION</th>
      <th style="padding:3px 6px;font-size:8px;font-weight:900;color:#000;text-align:right;">QTY</th>
      <th style="padding:3px 6px;font-size:8px;font-weight:900;color:#000;text-align:right;">RATE</th>
      <th style="padding:3px 8px 3px 4px;font-size:8px;font-weight:900;color:#000;text-align:right;">AMOUNT</th>
    </tr>`;

  /* ── Summary footer ── */
  const summaryHTML = `
    <div style="border:1.5px solid #000;margin-top:10px;">
      <div style="background:#000;color:#fff;text-align:center;padding:3px;font-weight:900;font-size:11px;letter-spacing:4px;">SUMMARY</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);">
        ${[
          ['Total Invoices',  data.count],
          ['Total Sales',     `&#8377;${Number(data.totalSales).toFixed(2)}`],
          ['Total GST',       `&#8377;${Number(data.totalGst).toFixed(2)}`],
          ['CGST',            `&#8377;${Number(data.totalCgst).toFixed(2)}`],
          ['SGST',            `&#8377;${Number(data.totalSgst).toFixed(2)}`],
          ['Amt Collected',   `&#8377;${Number(data.totalPaid).toFixed(2)}`],
          ['Balance Pending', `&#8377;${Number(data.totalBalance).toFixed(2)}`],
          ['Net Revenue',     `&#8377;${(Number(data.totalSales) - Number(data.totalGst)).toFixed(2)}`],
        ].map(([label, value]) => `
          <div style="padding:5px 8px;border-right:1px solid #aaa;border-bottom:1px solid #aaa;">
            <div style="font-size:8px;font-weight:900;color:#444;text-transform:uppercase;">${label}</div>
            <div style="font-size:11px;font-weight:900;color:#000;">${value}</div>
          </div>`).join('')}
      </div>
      <div style="text-align:center;padding:4px;font-size:8.5px;font-weight:900;color:#000;border-top:1px solid #aaa;">
        Generated: ${generatedDate} ${generatedTime} &nbsp;|&nbsp; Computer Generated Sales Report — Muthupandi Fish Farm
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sales Report - Muthupandi Fish Farm</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; font-family:'Courier New', Courier, monospace; color:#000; }
    table { border-collapse: collapse; width: 100%; }
    tr { page-break-inside: avoid; }
    @media print {
      @page { size: A4; margin: 8mm; }
      body  { margin: 0; }
    }
  </style>
</head>
<body>
  <div style="width:210mm;background:#fff;font-family:'Courier New',Courier,monospace;color:#000;padding:6mm;box-sizing:border-box;">

    ${headerHTML}
    ${titleBarHTML}

    <!-- ═══ LEDGER TABLE ═══ -->
    <table>
      <thead>${tableHeaderHTML}</thead>
      <tbody>
        ${allRows}
        <!-- Final bottom border -->
        <tr><td colspan="5" style="border-top:2px solid #000;padding:0;"></td></tr>
      </tbody>
    </table>

    ${summaryHTML}
  </div>
</body>
</html>`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   React Component — unchanged UI, only PDF output changed
═══════════════════════════════════════════════════════════════════════════ */
const SalesReport = () => {
  const [period, setPeriod]       = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (period !== 'custom') params.period = period;
      else {
        if (startDate) params.startDate = startDate;
        if (endDate)   params.endDate   = endDate;
      }
      const res = await invoiceAPI.getReport(params);
      setData(res.data.data);
    } catch {
      showToast('Error loading report', 'error');
    }
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

    const sortedInvoices = [...data.invoices].sort((a, b) => {
      const numA = parseInt(String(a.invoiceNo).replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.invoiceNo).replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    const rows = [
      ['MUTHUPANDI FISH FARM - SALES REPORT'],
      ['Period:', period !== 'custom' ? period : `${startDate} to ${endDate}`],
      ['Generated:', new Date().toLocaleDateString('en-IN')],
      [],
      ['Invoice No', 'Date', 'Buyer', 'Phone', 'City', 'Subtotal', 'CGST', 'SGST', 'Total GST', 'Transport', 'Net Amount', 'Paid', 'Balance', 'Status'],
      ...sortedInvoices.map(inv => [
        inv.invoiceNo,
        new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
        inv.buyerName,
        inv.buyerPhone || '',
        inv.buyerCity || inv.city || '',
        inv.subtotal || 0,
        inv.cgstAmount || 0,
        inv.sgstAmount || 0,
        inv.totalGst || 0,
        inv.transport || 0,
        inv.netAmount || inv.grandTotal || 0,
        inv.paidAmount || 0,
        inv.balanceAmount || 0,
        inv.paymentStatus,
      ]),
      [],
      ['TOTALS', '', '', '', '', '', '', '', data.totalGst, '', data.totalSales, data.totalPaid, data.totalBalance, ''],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SalesReport_${period}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = s => ({ Paid: '#4ade80', Pending: '#fbbf24', Partial: '#fb923c' }[s] || '#94a3b8');

  const sortedDisplayInvoices = data
    ? [...data.invoices].sort((a, b) => {
        const numA = parseInt(String(a.invoiceNo).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.invoiceNo).replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      })
    : [];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.type==='error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color:'white', padding:'12px 20px', borderRadius:10, fontWeight:600 }}>
          <i className={`bi ${toast.type==='error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin:0, fontFamily:'var(--font-accent)', color:'var(--ocean-foam)' }}>Sales Report</h5>
          <small style={{ color:'var(--text-secondary)' }}>Filter and export sales data with GST breakdown</small>
        </div>
        {data && (
          <div className="d-flex gap-2">
            <button className="btn btn-sm" onClick={handlePrint}
              style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--coral)' }}>
              <i className="bi bi-file-earmark-pdf me-1" />Print / Save PDF
            </button>
            <button className="btn btn-sm" onClick={handleExcelExport}
              style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'var(--green-sea)' }}>
              <i className="bi bi-file-earmark-excel me-1" />Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <div className="glass-card p-4 mb-4">
        <h6 style={{ color:'var(--ocean-glow)', marginBottom:16 }}><i className="bi bi-funnel me-2" />Filter Report</h6>
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label style={{ color:'var(--text-secondary)', fontSize:'0.8rem', display:'block', marginBottom:8 }}>Period</label>
            <div className="d-flex gap-2 flex-wrap">
              {PERIODS.map(p => (
                <button key={p.value} className="btn btn-sm" onClick={() => setPeriod(p.value)} style={{
                  background: period===p.value ? 'rgba(6,182,212,0.2)' : 'var(--glass)',
                  border: `1px solid ${period===p.value ? 'rgba(6,182,212,0.5)' : 'var(--glass-border)'}`,
                  color: period===p.value ? 'var(--ocean-light)' : 'var(--text-secondary)',
                  fontSize:'0.8rem', padding:'6px 14px', borderRadius:8,
                }}>{p.label}</button>
              ))}
            </div>
          </div>
          {period === 'custom' && (
            <div className="col-md-4">
              <div className="d-flex gap-2">
                <div>
                  <label style={{ color:'var(--text-secondary)', fontSize:'0.78rem' }}>From</label>
                  <input type="date" className="form-control input-ocean form-control-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ color:'var(--text-secondary)', fontSize:'0.78rem' }}>To</label>
                  <input type="date" className="form-control input-ocean form-control-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <div className="col-md-3">
            <button className="btn-ocean btn w-100" onClick={loadReport} disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Loading...</>
                : <><i className="bi bi-graph-up me-2" />Generate Report</>}
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
              { label:'Total Sales',       value:`₹${Number(data.totalSales).toLocaleString('en-IN')}`,  color:'var(--gold)',         icon:'bi-currency-rupee', bg:'rgba(245,158,11,0.1)' },
              { label:'CGST Collected',    value:`₹${Number(data.totalCgst).toLocaleString('en-IN')}`,   color:'var(--ocean-glow)',   icon:'bi-percent',        bg:'rgba(34,211,238,0.1)' },
              { label:'SGST Collected',    value:`₹${Number(data.totalSgst).toLocaleString('en-IN')}`,   color:'var(--ocean-light)',  icon:'bi-percent',        bg:'rgba(6,182,212,0.1)'  },
              { label:'Total GST',         value:`₹${Number(data.totalGst).toLocaleString('en-IN')}`,    color:'#a78bfa',            icon:'bi-receipt',        bg:'rgba(167,139,250,0.1)'},
              { label:'Amount Collected',  value:`₹${Number(data.totalPaid).toLocaleString('en-IN')}`,   color:'#4ade80',            icon:'bi-check-circle',   bg:'rgba(74,222,128,0.1)' },
              { label:'Balance Pending',   value:`₹${Number(data.totalBalance).toLocaleString('en-IN')}`,color:'#fca5a5',            icon:'bi-exclamation-circle',bg:'rgba(252,165,165,0.1)'},
              { label:'Total Invoices',    value:data.count,                                             color:'var(--ocean-light)', icon:'bi-file-text',      bg:'rgba(6,182,212,0.1)'  },
            ].map(c => (
              <div key={c.label} className="col-6 col-md-3">
                <div className="glass-card p-3 d-flex align-items-center gap-3" style={{ background:c.bg }}>
                  <i className={`bi ${c.icon}`} style={{ color:c.color, fontSize:'1.4rem' }} />
                  <div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>{c.label}</div>
                    <div style={{ color:c.color, fontWeight:800, fontSize:'1rem' }}>{c.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Invoice List */}
          <div className="glass-card overflow-hidden">
            <div className="p-3 d-flex justify-content-between align-items-center" style={{ borderBottom:'1px solid var(--glass-border)' }}>
              <h6 style={{ margin:0, color:'var(--ocean-glow)' }}>Bills — {data.count} records</h6>
            </div>
            <div style={{ overflowX:'auto' }}>
              {sortedDisplayInvoices.length === 0 ? (
                <div className="text-center py-4" style={{ color:'var(--text-secondary)' }}>No invoices for this period</div>
              ) : sortedDisplayInvoices.map(inv => (
                <div key={inv._id} style={{ borderBottom:'1px solid var(--glass-border)' }}>
                  {/* Bill header */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:'rgba(6,182,212,0.07)', flexWrap:'wrap' }}>
                    <span style={{ color:'var(--ocean-glow)', fontWeight:800, fontSize:'0.9rem', minWidth:60 }}>#{inv.invoiceNo}</span>
                    <span style={{ color:'var(--text-secondary)', fontSize:'0.8rem', minWidth:80 }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</span>
                    <span style={{ fontWeight:700, color:'var(--ocean-foam)', flex:1 }}>{inv.buyerName}</span>
                    {inv.buyerPhone && <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{inv.buyerPhone}</span>}
                    {(inv.buyerCity || inv.city) && (
                      <span style={{ fontSize:'0.78rem', color:'var(--ocean-light)', fontWeight:600 }}>
                        📍 {inv.buyerCity || inv.city}
                      </span>
                    )}
                    <span style={{ color:'var(--gold-light)', fontWeight:800, fontSize:'0.95rem' }}>₹{Number(inv.netAmount || inv.grandTotal || 0).toLocaleString('en-IN')}</span>
                    <span style={{ color: inv.balanceAmount > 0 ? '#fca5a5' : '#4ade80', fontSize:'0.8rem', fontWeight:600 }}>
                      {inv.balanceAmount > 0 ? `Bal ₹${Number(inv.balanceAmount).toLocaleString('en-IN')}` : '✓ Paid'}
                    </span>
                    <span style={{ padding:'2px 8px', borderRadius:12, fontSize:'0.7rem', fontWeight:600, background:`${statusColor(inv.paymentStatus)}22`, color:statusColor(inv.paymentStatus), border:`1px solid ${statusColor(inv.paymentStatus)}44` }}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                  {/* Product lines */}
                  {(inv.items || []).length > 0 && (
                    <div style={{ padding:'4px 16px 8px 32px' }}>
                      {(inv.items || []).map((item, i) => (
                        <div key={i} style={{ display:'flex', gap:12, padding:'3px 0', borderBottom:'1px dotted var(--glass-border)', fontSize:'0.8rem', color:'var(--text-secondary)', flexWrap:'wrap' }}>
                          <span style={{ flex:1, color:'var(--ocean-foam)' }}>{item.description}</span>
                          <span>Rate: <strong style={{ color:'var(--ocean-light)' }}>₹{Number(item.rate||0).toFixed(2)}</strong></span>
                          <span>Qty: <strong>{item.quantity}</strong> {item.pack}</span>
                          <span style={{ fontWeight:700, color:'var(--gold-light)' }}>₹{Number(item.amount||0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* Totals */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:24, padding:'12px 16px', borderTop:'2px solid var(--glass-border)', background:'rgba(6,182,212,0.05)', flexWrap:'wrap' }}>
                <span style={{ color:'var(--text-secondary)', fontWeight:700 }}>TOTAL ({data.count} bills)</span>
                <span style={{ color:'var(--gold)', fontWeight:800, fontSize:'1.05rem' }}>₹{Number(data.totalSales).toLocaleString('en-IN')}</span>
                <span style={{ color:'#4ade80', fontWeight:700 }}>Paid: ₹{Number(data.totalPaid).toLocaleString('en-IN')}</span>
                <span style={{ color:'#fca5a5', fontWeight:700 }}>Balance: ₹{Number(data.totalBalance).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="glass-card p-5 text-center" style={{ color:'var(--text-secondary)' }}>
          <i className="bi bi-graph-up-arrow" style={{ fontSize:'3rem', color:'var(--ocean-light)', display:'block', marginBottom:12 }} />
          <p>Select a period and click <strong style={{ color:'var(--ocean-light)' }}>Generate Report</strong></p>
        </div>
      )}
    </div>
  );
};

export default SalesReport;