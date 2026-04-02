// src/components/admin/CreateInvoice.jsx
import React, { useState, useEffect, useRef } from 'react';
import { invoiceAPI, productAPI, customerAPI } from '../../services/api';

import fishImg1 from '../../assets/fishImg1.jpg';
import fishImg2 from '../../assets/fishImg2.jpg';
import bannerImg from '../../assets/BannerImg.jpeg';
import qrCodeImg from '../../assets/QR code image.jpeg';

const UNITS = ['Pcs', 'Nos', 'Kg', 'Ltr', 'Round', 'Set', 'Pair'];

// Empty items start with blank strings (not 0) so inputs are clean
const emptyItem = () => ({
  _tempId: Date.now() + Math.random(),
  description: '',
  quantity: '',
  pack: 'Pcs',
  rate: '',
  discount: '',
  amount: 0,
});

// A row is "complete" when description AND rate are both filled
const isRowComplete = (item) =>
  item.description.trim() !== '' && item.rate !== '' && parseFloat(item.rate) > 0;

const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function numToWords(n) {
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + numToWords(-n);
  let w = '';
  if (Math.floor(n/10000000) > 0) { w += numToWords(Math.floor(n/10000000)) + ' Crore '; n %= 10000000; }
  if (Math.floor(n/100000)   > 0) { w += numToWords(Math.floor(n/100000))   + ' Lakh ';  n %= 100000;   }
  if (Math.floor(n/1000)     > 0) { w += numToWords(Math.floor(n/1000))     + ' Thousand '; n %= 1000;   }
  if (Math.floor(n/100)      > 0) { w += numToWords(Math.floor(n/100))      + ' Hundred ';  n %= 100;    }
  if (n >= 20) { w += tens[Math.floor(n/10)] + ' '; n %= 10; }
  if (n > 0)   w += ones[n] + ' ';
  return w.trim();
}
function amountInWords(amount) {
  const int = Math.floor(amount);
  const dec = Math.round((amount - int) * 100);
  let w = numToWords(int) + ' Rupees';
  if (dec > 0) w += ' and ' + numToWords(dec) + ' Paise';
  return w + ' Only';
}

// Amount = qty × rate − discount. Rate comes from what user types, NOT from product.
const calcItem = (item) => {
  const qty  = parseFloat(item.quantity) || 0;
  const rate = parseFloat(item.rate)     || 0;
  const disc = parseFloat(item.discount) || 0;
  return parseFloat(((qty * rate) - disc).toFixed(2));
};

const ITEMS_PER_PAGE = 18;
const splitItemsIntoPages = (items) => {
  const pages = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  if (pages.length === 0) pages.push([]);
  return pages;
};

/* ── base64 helper for print window ── */
const imageToBase64 = (url) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    resolve(c.toDataURL());
  };
  img.onerror = () => resolve('');
  img.src = url;
});

/* ── Invoice print HTML (PDF) ── */
const generateInvoiceHTML = async (invoice) => {
  const [fish1B64, fish2B64, bannerB64, qrB64] = await Promise.all([
    imageToBase64(fishImg1), imageToBase64(fishImg2),
    imageToBase64(bannerImg), imageToBase64(qrCodeImg),
  ]);

  const pages      = splitItemsIntoPages(invoice.items || []);
  const totalPages = pages.length;
  const subtotal   = (invoice.items || []).reduce((a, i) => a + (parseFloat(i.amount) || 0), 0);
  const cgstAmt    = invoice.cgstAmount || 0;
  const sgstAmt    = invoice.sgstAmount || 0;
  const totalGst   = invoice.totalGst   || 0;
  const grandTotal = invoice.grandTotal || subtotal + totalGst;
  const netAmount  = invoice.netAmount  || grandTotal + (invoice.transport || 0);
  const balAmt     = invoice.balanceAmount || 0;

  const tamilBlessing = `<div style="text-align:center;font-size:10px;font-weight:900;color:#000;margin-bottom:4px;font-family:'Noto Sans Tamil','Latha','Arial Unicode MS',Arial,sans-serif;letter-spacing:3px;">ஸ்ரீ பாண்டி துணை</div>`;

  const pagesHTML = pages.map((pageItems, pi) => {
    const isLast = pi === totalPages - 1;
    const pageNum = pi + 1;
    const emptyCount = Math.max(0, ITEMS_PER_PAGE - pageItems.length);

    // Columns: Sl | Description | Rate | Qty | Pack | Disc | Amount
    const itemRows = pageItems.map(item => `
      <tr>
        <td style="border:1px solid #000;padding:5px 6px;font-size:12px;font-weight:700;text-align:center;">${item.slNo||''}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:12px;font-weight:700;">${item.description}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:12px;font-weight:700;text-align:right;">${Number(item.rate).toFixed(2)}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:12px;font-weight:700;text-align:right;">${item.quantity}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:12px;font-weight:700;text-align:center;">${item.pack}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:12px;font-weight:700;text-align:right;">${Number(item.discount||0).toFixed(2)}</td>
        <td style="border:1px solid #000;padding:5px 6px;font-size:12px;font-weight:900;text-align:right;">${Number(item.amount).toFixed(2)}</td>
      </tr>`).join('');

    const emptyRows = Array(emptyCount).fill(null).map(() =>
      `<tr>${Array(7).fill('<td style="border:1px solid #000;padding:5px 6px;font-size:12px;">&nbsp;</td>').join('')}</tr>`
    ).join('');

    const headerHTML = `
      ${tamilBlessing}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        ${fish1B64 ? `<img src="${fish1B64}" style="width:100px;height:90px;object-fit:cover;border:1px solid #ccc;border-radius:4px;">` : '<div style="width:100px;height:90px;"></div>'}
        <div style="text-align:center;flex:1;padding:0 10px;">
          ${bannerB64 ? `<img src="${bannerB64}" style="max-width:280px;max-height:80px;object-fit:contain;display:block;margin:0 auto 4px;">` : ''}
          <div style="font-weight:900;font-size:17px;letter-spacing:2px;">MUTHUPANDI FISH FARM</div>
          <div style="font-size:11px;font-weight:700;color:#333;">6/201 ITI COLONY, AATHIKULAM, K.PUDUR - MADURAI 7 TAMILNADU</div>
          <div style="font-size:11px;font-weight:700;color:#333;">Contact 9842186330 &nbsp; 9842886330</div>
        </div>
        ${fish2B64 ? `<img src="${fish2B64}" style="width:100px;height:90px;object-fit:cover;border:1px solid #ccc;border-radius:4px;">` : '<div style="width:100px;height:90px;"></div>'}
      </div>`;

    const footerSection = isLast ? `
      <div style="display:flex;border-top:1px solid #000;">
        <div style="flex:1;padding:8px 12px;border-right:1px solid #000;">
          <div style="font-size:11px;font-weight:700;color:#333;margin-bottom:4px;">Rupees</div>
          <div style="font-weight:900;font-size:12px;">${amountInWords(netAmount)}</div>
          ${balAmt > 0 ? `<div style="margin-top:6px;color:#c00;font-size:11px;font-weight:900;">Balance Due: ₹${Number(balAmt).toFixed(2)}</div>` : ''}
          <div style="margin-top:8px;font-size:11px;font-weight:900;color:#333;">E &amp; O E</div>
        </div>
        <div style="padding:8px 12px;min-width:200px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="font-size:11px;font-weight:700;color:#333;padding:3px 0;border-bottom:1px solid #ccc;">Page No</td><td style="font-size:11px;font-weight:900;text-align:right;padding:3px 0;border-bottom:1px solid #ccc;">${pageNum}</td></tr>
            <tr><td style="font-size:11px;font-weight:700;color:#333;padding:3px 0;border-bottom:1px solid #ccc;">Grand Total</td><td style="font-size:11px;font-weight:900;text-align:right;padding:3px 0;border-bottom:1px solid #ccc;">₹${Number(grandTotal).toFixed(2)}</td></tr>
            ${cgstAmt > 0 ? `<tr><td style="font-size:11px;font-weight:700;color:#333;padding:3px 0;border-bottom:1px solid #ccc;">CGST (${invoice.cgstPercent}%)</td><td style="font-size:11px;font-weight:900;text-align:right;padding:3px 0;border-bottom:1px solid #ccc;">₹${Number(cgstAmt).toFixed(2)}</td></tr>` : ''}
            ${sgstAmt > 0 ? `<tr><td style="font-size:11px;font-weight:700;color:#333;padding:3px 0;border-bottom:1px solid #ccc;">SGST (${invoice.sgstPercent}%)</td><td style="font-size:11px;font-weight:900;text-align:right;padding:3px 0;border-bottom:1px solid #ccc;">₹${Number(sgstAmt).toFixed(2)}</td></tr>` : ''}
            <tr><td style="font-size:11px;font-weight:700;color:#333;padding:3px 0;border-bottom:1px solid #ccc;">Transport</td><td style="font-size:11px;font-weight:900;text-align:right;padding:3px 0;border-bottom:1px solid #ccc;">₹${Number(invoice.transport||0).toFixed(2)}</td></tr>
            <tr><td style="font-size:12px;font-weight:900;padding:4px 0;border-bottom:2px solid #000;">Net Amount</td><td style="font-size:12px;font-weight:900;text-align:right;padding:4px 0;border-bottom:2px solid #000;">₹${Number(netAmount).toFixed(2)}</td></tr>
          </table>
        </div>
      </div>
      <div style="display:flex;border-top:1px solid #000;">
        <div style="flex:1;padding:8px 12px;border-right:1px solid #000;">
          <div style="font-size:11px;font-weight:900;margin-bottom:4px;color:#333;">Declarations</div>
          <div style="font-size:11px;font-weight:700;color:#333;">We declare that this invoice shows the actual prices of the goods described and that all particulars are true and correct</div>
        </div>
        <div style="flex:1;padding:8px 12px;">
          <div style="font-size:11px;font-weight:900;margin-bottom:4px;">Company's Bank Details</div>
          <div style="font-size:11px;display:flex;gap:8px;margin-bottom:2px;"><span style="font-weight:700;min-width:90px;">Bank Name</span><span style="font-weight:900;">STATE BANK OF INDIA</span></div>
          <div style="font-size:11px;display:flex;gap:8px;margin-bottom:2px;"><span style="font-weight:700;min-width:90px;">A/C No</span><span style="font-weight:900;">40487070452</span></div>
          <div style="font-size:11px;display:flex;gap:8px;"><span style="font-weight:700;min-width:90px;">Branch/IFSCODE</span><span style="font-weight:900;">OTHAKADAI &nbsp; SBIN0002246</span></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px;border-top:1px solid #000;font-size:12px;font-weight:900;">
        <span>Customer's Seal and Signature</span>
        <div style="text-align:center;">
          <div style="font-size:10px;color:#0066cc;font-weight:900;margin-bottom:2px;">SCAN &amp; PAY</div>
          ${qrB64 ? `<img src="${qrB64}" style="width:70px;height:70px;display:block;margin:0 auto;">` : '<div style="width:70px;height:70px;background:#eee;"></div>'}
        </div>
        <span>For Muthupandi Fish Farm</span>
      </div>
      <div style="text-align:center;padding:5px;border-top:1px solid #000;font-size:11px;font-weight:700;color:#333;">This is a Computer Generated Invoice</div>
    ` : `<div style="display:flex;justify-content:space-between;padding:8px 12px;border-top:1px solid #000;font-size:11px;font-weight:700;color:#333;"><span>Continued on next page...</span><span>Page ${pageNum} of ${totalPages}</span></div>`;

    return `
      <div style="width:210mm;background:#fff;font-family:Arial,sans-serif;color:#000;padding:8mm 10mm 0 10mm;box-sizing:border-box;page-break-after:${isLast?'auto':'always'};">
        ${headerHTML}
        <div style="border:2px solid #000;">
          <div style="text-align:center;padding:4px;border-bottom:2px solid #000;font-weight:900;font-size:15px;letter-spacing:6px;background:#f0f0f0;">INVOICE</div>
          <div style="display:flex;border-bottom:1px solid #000;">
            <div style="flex:1;padding:8px 12px;border-right:1px solid #000;">
              <div style="font-size:11px;font-weight:900;color:#333;margin-bottom:4px;">BUYER and Address</div>
              <div style="font-weight:900;font-size:13px;">${invoice.buyerName}</div>
              ${invoice.buyerCity ? `<div style="font-size:12px;font-weight:700;color:#333;">${invoice.buyerCity}</div>` : ''}
              ${invoice.buyerAddress && invoice.buyerAddress !== invoice.buyerCity ? `<div style="font-size:12px;font-weight:700;color:#333;">${invoice.buyerAddress}</div>` : ''}
              ${invoice.buyerPhone ? `<div style="font-size:12px;font-weight:700;color:#333;">📞 ${invoice.buyerPhone}</div>` : ''}
            </div>
            <div style="padding:8px 12px;min-width:220px;">
              <div style="font-size:14px;font-weight:900;color:#000;margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid #000;">INVOICE NO: ${invoice.invoiceNo}</div>
              ${[
                ['INVOICE DATE', new Date(invoice.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'})],
                ['STATE', invoice.state||'Tamil Nadu'],
                ['STATE CODE', invoice.stateCode||'33'],
                ['GSTIN', invoice.gstin||'33ARIPM4129M1ZK'],
              ].map(([l,v]) => `<div style="display:flex;gap:8px;font-size:11px;margin-bottom:3px;"><span style="color:#333;min-width:100px;font-weight:900;">${l}</span><span style="font-weight:900;">${v}</span></div>`).join('')}
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="border:1px solid #000;padding:6px;font-size:12px;font-weight:900;text-align:center;width:36px;">Sl</th>
                <th style="border:1px solid #000;padding:6px;font-size:12px;font-weight:900;text-align:left;">Description</th>
                <th style="border:1px solid #000;padding:6px;font-size:12px;font-weight:900;text-align:right;width:68px;">Rate</th>
                <th style="border:1px solid #000;padding:6px;font-size:12px;font-weight:900;text-align:right;width:55px;">Qty</th>
                <th style="border:1px solid #000;padding:6px;font-size:12px;font-weight:900;text-align:center;width:48px;">Pack</th>
                <th style="border:1px solid #000;padding:6px;font-size:12px;font-weight:900;text-align:right;width:55px;">Disc</th>
                <th style="border:1px solid #000;padding:6px;font-size:12px;font-weight:900;text-align:right;width:78px;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}${emptyRows}</tbody>
          </table>
          ${footerSection}
        </div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Invoice #${invoice.invoiceNo} - Muthupandi Fish Farm</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}
    @media print{@page{size:A4;margin:0;}body{margin:0;}}</style>
  </head><body>${pagesHTML}</body></html>`;
};

/* ── WhatsApp helper ── */
const handleWhatsAppPDF = async (invoice) => {
  try {
    const html = await generateInvoiceHTML(invoice);
    const pw = window.open('', '_blank', 'width=900,height=700');
    if (!pw) { alert('Please allow popups'); return; }
    pw.document.write(html); pw.document.close();
    setTimeout(() => {
      pw.focus(); pw.print();
      setTimeout(() => {
        const raw = invoice.buyerPhone ? invoice.buyerPhone.replace(/\D/g, '') : '';
        const phone = raw.length === 10 ? '91'+raw : raw;
        const msg = encodeURIComponent(
          `*MUTHUPANDI FISH FARM*\nInvoice #${invoice.invoiceNo} | Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}\n` +
          `Buyer: ${invoice.buyerName}\nNet Amount: ₹${Number(invoice.netAmount||invoice.grandTotal||0).toFixed(2)}\n` +
          `${invoice.balanceAmount>0?`Balance Due: ₹${Number(invoice.balanceAmount).toFixed(2)}\n`:''}Payment: ${invoice.paymentStatus}\n\nPlease find the attached invoice PDF. Thank you! 🐟`
        );
        window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
      }, 2500);
    }, 1500);
  } catch (e) { console.error(e); alert('Error generating invoice.'); }
};

/* ══════════════════════════════════════════════
   CreateInvoice component
══════════════════════════════════════════════ */
const CreateInvoice = ({ onSaved, editData }) => {
  const [products, setProducts]         = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [toast, setToast]               = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [nextInvoiceNo, setNextInvoiceNo] = useState(null);

  const [header, setHeader] = useState({
    buyerName: '', buyerAddress: '', buyerPhone: '', buyerCity: '',
    customerId: '',
    state: 'Tamil Nadu', stateCode: '33', gstin: '33ARIPM4129M1ZK',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'Pending', paidAmount: '',
    cgstPercent: '', sgstPercent: '',
    transport: '', notes: '',
  });
  const [items, setItems] = useState([emptyItem()]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    productAPI.getAll({ isActive: true }).then(r => setProducts(r.data.data||[])).catch(()=>{});
    customerAPI.getAll().then(r => setCustomers(r.data.data||[])).catch(()=>{});

    // Try to fetch the next invoice number for the badge
    invoiceAPI.getAll && invoiceAPI.getAll({ limit: 1, sort: '-invoiceNo' })
      .then(r => {
        const list = r.data?.data || [];
        const lastNo = list[0]?.invoiceNo;
        if (lastNo) {
          // invoiceNo may be numeric string or number
          const num = parseInt(String(lastNo).replace(/\D/g, ''), 10);
          if (!isNaN(num)) setNextInvoiceNo(num + 1);
        }
      }).catch(() => {});

    if (editData) {
      setNextInvoiceNo(editData.invoiceNo);
      setHeader({
        buyerName: editData.buyerName||'', buyerAddress: editData.buyerAddress||'',
        buyerPhone: editData.buyerPhone||'', buyerCity: editData.buyerCity||'',
        customerId: editData.customerId||'',
        state: editData.state||'Tamil Nadu', stateCode: editData.stateCode||'33',
        gstin: editData.gstin||'33ARIPM4129M1ZK',
        invoiceDate: editData.invoiceDate?.split('T')[0]||new Date().toISOString().split('T')[0],
        paymentStatus: editData.paymentStatus||'Pending',
        paidAmount: editData.paidAmount||'',
        cgstPercent: editData.cgstPercent||'', sgstPercent: editData.sgstPercent||'',
        transport: editData.transport||'', notes: editData.notes||'',
      });
      setItems(editData.items?.map(i => ({ ...i, _tempId: Math.random() })) || [emptyItem()]);
    }
  }, [editData]);

  // Totals
  const subtotal     = items.reduce((a, i) => a + calcItem(i), 0);
  const totalDisc    = items.reduce((a, i) => a + (parseFloat(i.discount)||0), 0);
  const cgstAmt      = parseFloat(((subtotal * (parseFloat(header.cgstPercent)||0)) / 100).toFixed(2));
  const sgstAmt      = parseFloat(((subtotal * (parseFloat(header.sgstPercent)||0)) / 100).toFixed(2));
  const totalGst     = parseFloat((cgstAmt + sgstAmt).toFixed(2));
  const grandTotal   = parseFloat((subtotal + totalGst).toFixed(2));
  const transportAmt = parseFloat(header.transport||0);
  const netAmount    = parseFloat((grandTotal + transportAmt).toFixed(2));
  const paidAmt      = parseFloat(header.paidAmount||0);
  const balanceAmt   = parseFloat((netAmount - paidAmt).toFixed(2));

  /* Update a field on an item; if last row just completed, auto-append new row */
  const updateItem = (tempId, field, value) => {
    setItems(prev => {
      const next = prev.map(item => {
        if (item._tempId !== tempId) return item;
        const updated = { ...item, [field]: value };
        updated.amount = calcItem(updated);
        return updated;
      });

      // Auto-add row only when updating the very last row and it becomes complete
      const lastRow = next[next.length - 1];
      if (lastRow._tempId === tempId && isRowComplete(lastRow)) {
        return [...next, emptyItem()];
      }
      return next;
    });
  };

  /* Product selected → fill description + pack only. Rate stays blank for user to enter. */
  const selectProduct = (tempId, name) => {
    const prod = products.find(p => p.name === name);
    if (!prod) return;
    setItems(prev => prev.map(item => {
      if (item._tempId !== tempId) return item;
      const updated = { ...item, description: name, pack: prod.unit || item.pack };
      // DO NOT fill rate from product — user enters it manually each invoice
      updated.amount = calcItem(updated);
      return updated;
    }));
  };

  const selectCustomer = (c) => {
    setHeader(p => ({ ...p, customerId: c._id, buyerName: c.name, buyerPhone: c.mobile, buyerCity: c.city||'', buyerAddress: c.city||'', state: c.state||'Tamil Nadu' }));
    setCustomerSearch(c.name);
    setShowCustomerDrop(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.mobile.includes(customerSearch)
  );

  const removeItem = (tempId) => {
    if (items.length === 1) return showToast('At least one item required', 'error');
    setItems(prev => prev.filter(i => i._tempId !== tempId));
  };
  const handleHeaderChange = e => setHeader(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!header.buyerName.trim()) return showToast('Buyer name is required', 'error');
    const filledItems = items.filter(i => i.description.trim());
    if (filledItems.length === 0) return showToast('At least one item with description is required', 'error');
    setSaving(true);
    try {
      const payload = {
        ...header,
        cgstPercent: parseFloat(header.cgstPercent)||0,
        sgstPercent: parseFloat(header.sgstPercent)||0,
        transport:   parseFloat(header.transport)||0,
        paidAmount:  parseFloat(header.paidAmount)||0,
        items: filledItems.map((item, idx) => ({
          slNo: idx+1, description: item.description,
          quantity: parseFloat(item.quantity)||0, pack: item.pack,
          rate: parseFloat(item.rate)||0, discount: parseFloat(item.discount)||0,
          amount: calcItem(item),
        })),
      };
      const res = editData
        ? await invoiceAPI.update(editData._id, payload)
        : await invoiceAPI.create(payload);

      // Deduct stock
      for (const item of payload.items) {
        const prod = products.find(p => p.name === item.description);
        if (prod?._id && prod.stock !== undefined) {
          const newStock = Math.max(0, (parseInt(prod.stock)||0) - item.quantity);
          try { await productAPI.update(prod._id, { ...prod, stock: newStock }); }
          catch (e) { console.warn('stock update failed', prod.name, e); }
        }
      }

      setSavedInvoice(res.data.data);
      setSaved(true);
      showToast(`Invoice #${res.data.data.invoiceNo} saved!`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving invoice', 'error');
    } finally { setSaving(false); }
  };

  const handleNew = () => {
    setSaved(false); setSavedInvoice(null); setNextInvoiceNo(null);
    setHeader({ buyerName:'', buyerAddress:'', buyerPhone:'', buyerCity:'', customerId:'', state:'Tamil Nadu', stateCode:'33', gstin:'33ARIPM4129M1ZK', invoiceDate:new Date().toISOString().split('T')[0], paymentStatus:'Pending', paidAmount:'', cgstPercent:'', sgstPercent:'', transport:'', notes:'' });
    setItems([emptyItem()]);
    setCustomerSearch('');
  };

  if (saved && savedInvoice) {
    return <SavedInvoiceView invoice={savedInvoice} onNew={handleNew} onBack={() => onSaved && onSaved()} toast={toast} />;
  }

  /* ── number input style — plain text, decimal keyboard on mobile ── */
  const numStyle = { fontSize: '0.85rem' };

  return (
    <div>
      {toast && <Toast toast={toast} />}

      {/* ── Top bar: title + Invoice No badge + Save button ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>
            {editData ? 'Edit Invoice' : 'Create New Invoice'}
          </h5>
          <small style={{ color: 'var(--text-secondary)' }}>Rate entered here is used for amount — not the product price</small>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          {nextInvoiceNo && (
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.45)', borderRadius: 10, padding: '6px 18px', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Invoice No</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--gold)', lineHeight: 1.1 }}>#{nextInvoiceNo}</div>
            </div>
          )}
          <button className="btn-ocean btn" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving...</> : <><i className="bi bi-floppy me-2"/>Save Invoice</>}
          </button>
        </div>
      </div>

      {/* ── Buyer Info ── */}
      <div className="glass-card p-4 mb-4">
        <h6 style={{ color: 'var(--ocean-glow)', fontFamily: 'var(--font-accent)', marginBottom: 16 }}>
          <i className="bi bi-person-fill me-2"/>Buyer Information
        </h6>
        <div className="row g-3">
          <div className="col-md-4" style={{ position: 'relative' }}>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Customer Name *</label>
            <input className="form-control input-ocean"
              value={customerSearch || header.buyerName}
              onChange={e => { setCustomerSearch(e.target.value); setHeader(p => ({ ...p, buyerName: e.target.value, customerId: '' })); setShowCustomerDrop(true); }}
              onFocus={() => setShowCustomerDrop(true)}
              onBlur={() => setTimeout(() => setShowCustomerDrop(false), 200)}
              placeholder="Type or select customer..." />
            {showCustomerDrop && filteredCustomers.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:1000, background:'var(--ocean-mid)', border:'1px solid var(--glass-border)', borderRadius:8, maxHeight:220, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
                {filteredCustomers.map(c => (
                  <div key={c._id} onMouseDown={() => selectCustomer(c)}
                    style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--glass-border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(6,182,212,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{ fontWeight:600, color:'var(--ocean-foam)', fontSize:'0.88rem' }}>{c.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{c.mobile}{c.city ? ` • ${c.city}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
            {header.customerId && customers.find(c => c._id === header.customerId)?.balanceAmount > 0 && (
              <div style={{ marginTop:4, fontSize:'0.75rem', color:'#fca5a5' }}>
                <i className="bi bi-exclamation-circle me-1"/>
                Pending: ₹{customers.find(c => c._id === header.customerId)?.balanceAmount.toLocaleString('en-IN')}
              </div>
            )}
          </div>
          <div className="col-md-2"><label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>Mobile</label><input name="buyerPhone" className="form-control input-ocean" value={header.buyerPhone} onChange={handleHeaderChange} placeholder="9876543210" inputMode="tel"/></div>
          <div className="col-md-2"><label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>City</label><input name="buyerCity" className="form-control input-ocean" value={header.buyerCity} onChange={handleHeaderChange} placeholder="City"/></div>
          <div className="col-md-2"><label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>Invoice Date</label><input name="invoiceDate" type="date" className="form-control input-ocean" value={header.invoiceDate} onChange={handleHeaderChange}/></div>
          <div className="col-md-2"><label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>Payment Status</label><select name="paymentStatus" className="form-select input-ocean" value={header.paymentStatus} onChange={handleHeaderChange}><option>Pending</option><option>Paid</option><option>Partial</option></select></div>
          <div className="col-md-2"><label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>Paid Amount (₹)</label><input name="paidAmount" className="form-control input-ocean" value={header.paidAmount} onChange={handleHeaderChange} placeholder="0" inputMode="decimal"/></div>
          <div className="col-md-2"><label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>State</label><input name="state" className="form-control input-ocean" value={header.state} onChange={handleHeaderChange}/></div>
          <div className="col-md-1"><label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>Code</label><input name="stateCode" className="form-control input-ocean" value={header.stateCode} onChange={handleHeaderChange}/></div>
          <div className="col-md-3"><label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>Address</label><input name="buyerAddress" className="form-control input-ocean" value={header.buyerAddress} onChange={handleHeaderChange} placeholder="Address"/></div>
        </div>
      </div>

      {/* ── Invoice Items ── */}
      <div className="glass-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 style={{ color:'var(--ocean-glow)', fontFamily:'var(--font-accent)', margin:0 }}>
            <i className="bi bi-table me-2"/>Invoice Items
          </h6>
          <small style={{ color:'var(--text-secondary)', fontSize:'0.76rem' }}>
            <i className="bi bi-info-circle me-1"/>New row auto-appears after Description + Rate filled
          </small>
        </div>
        <div className="table-responsive">
          <table className="table table-ocean mb-0">
            <thead>
              <tr>
                <th style={{ width:36 }}>#</th>
                <th style={{ minWidth:200 }}>Description</th>
                <th style={{ width:105 }}>Rate (₹)</th>
                <th style={{ width:85 }}>Qty</th>
                <th style={{ width:85 }}>Pack</th>
                <th style={{ width:85 }}>Disc (₹)</th>
                <th style={{ width:110 }}>Amount (₹)</th>
                <th style={{ width:38 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const selProd = products.find(p => p.name === item.description);
                return (
                  <tr key={item._tempId}>
                    <td style={{ color:'var(--text-secondary)', fontSize:'0.85rem', paddingTop:14 }}>{idx+1}</td>

                    {/* Description */}
                    <td>
                      <input className="form-control input-ocean" list={`prod-${item._tempId}`}
                        value={item.description}
                        onChange={e => { updateItem(item._tempId, 'description', e.target.value); selectProduct(item._tempId, e.target.value); }}
                        placeholder="Select or type..."
                        style={{ fontSize:'0.85rem' }} />
                      <datalist id={`prod-${item._tempId}`}>
                        {products.map(p => <option key={p._id} value={p.name}/>)}
                      </datalist>
                      {selProd?.stock !== undefined && (
                        <div style={{ fontSize:'0.7rem', marginTop:2, color: selProd.stock < 10 ? '#fbbf24' : '#4ade80' }}>
                          Stock: {selProd.stock} {selProd.unit}
                        </div>
                      )}
                    </td>

                    {/* Rate — FIRST, user types current price */}
                    <td>
                      <input className="form-control input-ocean" style={numStyle}
                        value={item.rate}
                        onChange={e => updateItem(item._tempId, 'rate', e.target.value)}
                        placeholder="0.00"
                        inputMode="decimal" />
                    </td>

                    {/* Qty */}
                    <td>
                      <input className="form-control input-ocean" style={numStyle}
                        value={item.quantity}
                        onChange={e => updateItem(item._tempId, 'quantity', e.target.value)}
                        placeholder="0"
                        inputMode="decimal" />
                    </td>

                    {/* Pack — auto-filled from product, still editable */}
                    <td>
                      <select className="form-select input-ocean" value={item.pack}
                        onChange={e => updateItem(item._tempId, 'pack', e.target.value)}
                        style={{ fontSize:'0.85rem' }}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>

                    {/* Discount */}
                    <td>
                      <input className="form-control input-ocean" style={numStyle}
                        value={item.discount}
                        onChange={e => updateItem(item._tempId, 'discount', e.target.value)}
                        placeholder="0"
                        inputMode="decimal" />
                    </td>

                    {/* Amount (read-only display) */}
                    <td>
                      <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'8px 12px', fontWeight:700, color:'var(--gold-light)', textAlign:'right', fontSize:'0.9rem', minHeight:38, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
                        {calcItem(item).toFixed(2)}
                      </div>
                    </td>

                    {/* Delete */}
                    <td>
                      <button onClick={() => removeItem(item._tempId)} className="btn btn-sm"
                        style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--coral)', borderRadius:6, padding:'6px 10px' }}>
                        <i className="bi bi-trash"/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals panel */}
        <div className="row justify-content-end mt-4">
          <div className="col-md-5">
            <div className="glass-card p-3 mb-3" style={{ background:'rgba(4,31,59,0.5)' }}>
              <h6 style={{ color:'var(--ocean-glow)', fontSize:'0.85rem', marginBottom:12 }}><i className="bi bi-percent me-2"/>GST &amp; Charges</h6>
              <div className="row g-2">
                <div className="col-6"><label style={{ color:'var(--text-secondary)', fontSize:'0.75rem' }}>CGST %</label><input name="cgstPercent" className="form-control input-ocean form-control-sm" value={header.cgstPercent} onChange={handleHeaderChange} placeholder="0" inputMode="decimal"/></div>
                <div className="col-6"><label style={{ color:'var(--text-secondary)', fontSize:'0.75rem' }}>SGST %</label><input name="sgstPercent" className="form-control input-ocean form-control-sm" value={header.sgstPercent} onChange={handleHeaderChange} placeholder="0" inputMode="decimal"/></div>
                <div className="col-6"><label style={{ color:'var(--text-secondary)', fontSize:'0.75rem' }}>Transport (₹)</label><input name="transport" className="form-control input-ocean form-control-sm" value={header.transport} onChange={handleHeaderChange} placeholder="0" inputMode="decimal"/></div>
              </div>
            </div>
            <div style={{ background:'rgba(4,31,59,0.6)', border:'1px solid var(--glass-border)', borderRadius:12, overflow:'hidden' }}>
              {[
                { label:'Subtotal', value:`₹${subtotal.toFixed(2)}` },
                totalDisc > 0 && { label:'Total Discount', value:`-₹${totalDisc.toFixed(2)}`, color:'var(--coral)' },
                parseFloat(header.cgstPercent) > 0 && { label:`CGST (${header.cgstPercent}%)`, value:`₹${cgstAmt.toFixed(2)}`, color:'var(--ocean-light)' },
                parseFloat(header.sgstPercent) > 0 && { label:`SGST (${header.sgstPercent}%)`, value:`₹${sgstAmt.toFixed(2)}`, color:'var(--ocean-light)' },
                totalGst > 0 && { label:'Total GST', value:`₹${totalGst.toFixed(2)}`, color:'var(--ocean-glow)' },
                transportAmt > 0 && { label:'Transport', value:`₹${transportAmt.toFixed(2)}` },
              ].filter(Boolean).map((row, i) => (
                <div key={i} className="d-flex justify-content-between p-3" style={{ borderBottom:'1px solid var(--glass-border)' }}>
                  <span style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>{row.label}</span>
                  <span style={{ fontWeight:600, color:row.color||'inherit' }}>{row.value}</span>
                </div>
              ))}
              <div className="d-flex justify-content-between p-3" style={{ borderBottom:'1px solid var(--glass-border)', background:'rgba(6,182,212,0.05)' }}>
                <span style={{ fontFamily:'var(--font-accent)', fontWeight:700, color:'var(--ocean-glow)' }}>NET AMOUNT</span>
                <span style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--gold)' }}>₹{netAmount.toFixed(2)}</span>
              </div>
              {paidAmt > 0 && <div className="d-flex justify-content-between p-3" style={{ borderBottom:'1px solid var(--glass-border)' }}><span style={{ color:'#4ade80', fontSize:'0.85rem' }}>Paid Amount</span><span style={{ color:'#4ade80', fontWeight:600 }}>₹{paidAmt.toFixed(2)}</span></div>}
              {balanceAmt > 0 && <div className="d-flex justify-content-between p-3"><span style={{ color:'#fca5a5', fontSize:'0.85rem' }}>Balance Due</span><span style={{ color:'#fca5a5', fontWeight:700 }}>₹{balanceAmt.toFixed(2)}</span></div>}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 mb-4">
        <label className="form-label" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>Notes / Remarks</label>
        <textarea name="notes" className="form-control input-ocean" rows="2" value={header.notes} onChange={handleHeaderChange} placeholder="Optional notes..."/>
      </div>

      <div className="d-flex gap-2">
        <button className="btn-ocean btn" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving...</> : <><i className="bi bi-floppy me-2"/>Save Invoice</>}
        </button>
      </div>
    </div>
  );
};

/* ── Toast ── */
const Toast = ({ toast }) => (
  <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.type==='error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color:'white', padding:'12px 20px', borderRadius:10, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>
    <i className={`bi ${toast.type==='error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`}/>{toast.msg}
  </div>
);

/* ── Saved invoice view ── */
const SavedInvoiceView = ({ invoice, onNew, onBack, toast }) => {
  const handlePrint = async () => {
    const html = await generateInvoiceHTML(invoice);
    const pw = window.open('', '_blank', 'width=900,height=700');
    if (!pw) { alert('Please allow popups'); return; }
    pw.document.write(html); pw.document.close();
    setTimeout(() => { pw.focus(); pw.print(); }, 1500);
  };

  const handleExcelExport = () => {
    const rows = [
      ['MUTHUPANDI FISH FARM'],['6/201 ITI Colony, Aathikulam, K.Pudur - Madurai 7 Tamilnadu'],['Contact: 9842186330 | 9842886330'],[],
      ['INVOICE'],
      ['Invoice No', invoice.invoiceNo,'Date',new Date(invoice.invoiceDate).toLocaleDateString('en-IN')],
      ['Buyer', invoice.buyerName,'Phone', invoice.buyerPhone||''],
      [],[,'Sl.No','Description','Rate','Quantity','Pack','Discount','Amount'],
      ...invoice.items.map(i=>[i.slNo,i.description,i.rate,i.quantity,i.pack,i.discount||0,i.amount]),
      [],[,'','','','','','Net Amount',invoice.netAmount],
    ].filter(Boolean);
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url;
    a.download=`Invoice_${invoice.invoiceNo}_${invoice.buyerName}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      {toast && <Toast toast={toast}/>}
      <div>
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <button className="btn-ocean btn" onClick={handlePrint}><i className="bi bi-printer me-2"/>Print Invoice</button>
          <button className="btn" onClick={handlePrint} style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--coral)' }}><i className="bi bi-file-earmark-pdf me-2"/>Save as PDF</button>
          <button className="btn" onClick={() => handleWhatsAppPDF(invoice)} style={{ background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.4)', color:'#4ade80' }}><i className="bi bi-whatsapp me-2"/>WhatsApp PDF</button>
          <button className="btn" onClick={handleExcelExport} style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'var(--green-sea)' }}><i className="bi bi-file-earmark-excel me-2"/>Export CSV</button>
          <button className="btn" onClick={onNew} style={{ background:'var(--glass)', border:'1px solid var(--glass-border)', color:'var(--text-secondary)' }}><i className="bi bi-file-plus me-2"/>New Invoice</button>
          <button className="btn" onClick={onBack} style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc' }}><i className="bi bi-list-ul me-2"/>All Invoices</button>
        </div>
        <div className="glass-card p-4">
          <InvoicePrintView invoice={invoice}/>
        </div>
      </div>
    </>
  );
};

/* ══ InvoicePrintView ══ */
export const InvoicePrintView = ({ invoice, printMode = false }) => {
  const P = printMode;
  const pages = splitItemsIntoPages(invoice.items||[]);
  const totalPages = pages.length;
  const subtotal   = (invoice.items||[]).reduce((a,i) => a+(parseFloat(i.amount)||0), 0);
  const cgstAmt    = invoice.cgstAmount || 0;
  const sgstAmt    = invoice.sgstAmount || 0;
  const grandTotal = invoice.grandTotal || subtotal+(invoice.totalGst||0);
  const netAmount  = invoice.netAmount  || grandTotal+(invoice.transport||0);
  const balAmt     = invoice.balanceAmount || 0;

  return (
    <div style={{ fontFamily:'Arial,sans-serif' }}>
      {pages.map((pageItems, pi) => {
        const isLast   = pi === totalPages - 1;
        const pageNum  = pi + 1;
        const emptyCount = Math.max(0, ITEMS_PER_PAGE - pageItems.length);
        return (
          <div key={pi} style={{ width:P?'210mm':'100%', background:P?'#fff':'transparent', padding:P?'8mm 10mm 0 10mm':0, boxSizing:'border-box', pageBreakAfter:isLast?'auto':'always', marginBottom:P?0:24 }}>
            {/* Tamil blessing */}
            <div style={{ textAlign:'center', fontSize:P?10:10, fontWeight:900, color:P?'#000':'var(--ocean-foam)', marginBottom:4, fontFamily:"'Noto Sans Tamil','Latha','Arial Unicode MS',Arial,sans-serif", letterSpacing:3 }}>
              ஸ்ரீ பாண்டி துணை
            </div>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <img src={fishImg1} alt="Fish" style={{ width:P?100:110, height:P?90:100, objectFit:'contain', border:'1px solid #ccc', borderRadius:4 }} onError={e=>{e.target.style.display='none';}}/>
              <div style={{ textAlign:'center', flex:1, padding:'0 8px' }}>
                <img src={bannerImg} alt="Banner" style={{ maxWidth:350, maxHeight:100, objectFit:'contain', display:'block', margin:'0 auto 4px' }} onError={e=>{e.target.style.display='none';}}/>
                <div style={{ fontWeight:900, fontSize:P?'16px':'19px', letterSpacing:2, color:P?'#000':'var(--ocean-foam)' }}>MUTHUPANDI FISH FARM</div>
                <div style={{ fontSize:11, fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>6/201 ITI COLONY, AATHIKULAM, K.PUDUR - MADURAI 7 TAMILNADU</div>
                <div style={{ fontSize:11, fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>Contact 9842186330 &nbsp;&nbsp; 9842886330</div>
              </div>
              <img src={fishImg2} alt="Fish" style={{ width:P?100:110, height:P?90:100, objectFit:'contain', border:'1px solid #ccc', borderRadius:4 }} onError={e=>{e.target.style.display='none';}}/>
            </div>

            <div style={{ border:P?'2px solid #000':'1px solid var(--glass-border)', borderRadius:P?0:8, overflow:'hidden' }}>
              <div style={{ textAlign:'center', padding:'5px', borderBottom:P?'2px solid #000':'1px solid var(--glass-border)', fontWeight:900, fontSize:15, letterSpacing:6, background:P?'#f0f0f0':'rgba(14,116,144,0.25)', color:P?'#000':'var(--ocean-glow)' }}>INVOICE</div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:P?'1px solid #000':'1px solid var(--glass-border)' }}>
                <div style={{ padding:'8px 14px', borderRight:P?'1px solid #000':'1px solid var(--glass-border)' }}>
                  <div style={{ fontSize:11, fontWeight:900, color:P?'#333':'var(--text-secondary)', marginBottom:4 }}>BUYER and Address</div>
                  <div style={{ fontWeight:900, fontSize:14 }}>{invoice.buyerName}</div>
                  {invoice.buyerCity && <div style={{ fontSize:12, fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>{invoice.buyerCity}</div>}
                  {invoice.buyerAddress && invoice.buyerAddress !== invoice.buyerCity && <div style={{ fontSize:12, fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>{invoice.buyerAddress}</div>}
                  {invoice.buyerPhone && <div style={{ fontSize:12, fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>📞 {invoice.buyerPhone}</div>}
                </div>
                <div style={{ padding:'8px 14px' }}>
                  {/* Invoice No prominent */}
                  <div style={{ fontSize:14, fontWeight:900, color:P?'#000':'var(--gold)', marginBottom:6, paddingBottom:4, borderBottom:P?'2px solid #000':'1px solid var(--glass-border)' }}>
                    INVOICE NO: {invoice.invoiceNo}
                  </div>
                  {[
                    ['INVOICE DATE', new Date(invoice.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'})],
                    ['STATE', invoice.state||'Tamil Nadu'],
                    ['STATE CODE', invoice.stateCode||'33'],
                    ['GSTIN', invoice.gstin||'33ARIPM4129M1ZK'],
                  ].map(([label,value]) => (
                    <div key={label} style={{ display:'flex', gap:8, fontSize:11, marginBottom:3 }}>
                      <span style={{ color:P?'#333':'var(--text-secondary)', minWidth:100, fontWeight:900 }}>{label}</span>
                      <span style={{ fontWeight:900 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items table — columns: Sl | Description | Rate | Qty | Pack | Disc | Amount */}
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:P?'#f0f0f0':'rgba(14,116,144,0.25)' }}>
                    {['Sl.No','Description of Goods','Rate','Qty','Pack','Disc','Amount'].map((h,i) => (
                      <th key={h} style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'7px 8px', fontWeight:900, fontSize:12, textAlign: i===0?'center': i===1?'left': i===4?'center':'right', color:P?'#000':'var(--ocean-foam)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'6px 8px', fontSize:12, fontWeight:700, textAlign:'center' }}>{item.slNo||i+1}</td>
                      <td style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'6px 8px', fontWeight:700, fontSize:12 }}>{item.description}</td>
                      <td style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'6px 8px', textAlign:'right', fontSize:12, fontWeight:700 }}>{Number(item.rate).toFixed(2)}</td>
                      <td style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'6px 8px', textAlign:'right', fontSize:12, fontWeight:700 }}>{item.quantity}</td>
                      <td style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'6px 8px', fontSize:12, fontWeight:700, textAlign:'center' }}>{item.pack}</td>
                      <td style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'6px 8px', textAlign:'right', fontSize:12, fontWeight:700 }}>{Number(item.discount||0).toFixed(2)}</td>
                      <td style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'6px 8px', textAlign:'right', fontWeight:900, fontSize:12, color:P?'#000':'var(--gold-light)' }}>{Number(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {Array(emptyCount).fill(null).map((_,i) => (
                    <tr key={`e${i}`}>{Array(7).fill(null).map((_,j) => <td key={j} style={{ border:P?'1px solid #000':'1px solid var(--glass-border)', padding:'6px 8px', fontSize:12 }}>&nbsp;</td>)}</tr>
                  ))}
                </tbody>
              </table>

              {isLast ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', borderTop:P?'1px solid #000':'1px solid var(--glass-border)' }}>
                    <div style={{ padding:'8px 14px', borderRight:P?'1px solid #000':'1px solid var(--glass-border)' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:P?'#333':'var(--text-secondary)', marginBottom:4 }}>Rupees</div>
                      <div style={{ fontWeight:900, fontSize:12 }}>{amountInWords(netAmount)}</div>
                      {balAmt > 0 && <div style={{ marginTop:6, color:P?'#c00':'#fca5a5', fontSize:11, fontWeight:900 }}>Balance Due: ₹{Number(balAmt).toFixed(2)}</div>}
                      <div style={{ marginTop:8, fontSize:11, fontWeight:900, color:P?'#333':'var(--text-secondary)' }}>E &amp; O E</div>
                    </div>
                    <div style={{ padding:'8px 14px', minWidth:200 }}>
                      {[
                        { label:'Page No', value:pageNum },
                        { label:'Grand Total', value:`₹${Number(grandTotal).toFixed(2)}`, bold:true },
                        cgstAmt > 0 && { label:`CGST (${invoice.cgstPercent}%)`, value:`₹${Number(cgstAmt).toFixed(2)}` },
                        sgstAmt > 0 && { label:`SGST (${invoice.sgstPercent}%)`, value:`₹${Number(sgstAmt).toFixed(2)}` },
                        { label:'Transport', value:`₹${Number(invoice.transport||0).toFixed(2)}` },
                        { label:'Net Amount', value:`₹${Number(netAmount).toFixed(2)}`, bold:true },
                        invoice.paidAmount > 0 && { label:'Paid Amount', value:`₹${Number(invoice.paidAmount).toFixed(2)}` },
                        balAmt > 0 && { label:'Balance Due', value:`₹${Number(balAmt).toFixed(2)}`, color:P?'#c00':'#fca5a5' },
                      ].filter(Boolean).map((row,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', borderBottom:P?'1px solid #ccc':'1px solid var(--glass-border)', padding:'4px 0', fontSize:11 }}>
                          <span style={{ fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>{row.label}</span>
                          <span style={{ fontWeight:row.bold?900:700, color:row.color||'inherit' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:P?'1px solid #000':'1px solid var(--glass-border)' }}>
                    <div style={{ padding:'8px 14px', borderRight:P?'1px solid #000':'1px solid var(--glass-border)' }}>
                      <div style={{ fontSize:11, fontWeight:900, marginBottom:4, color:P?'#333':'var(--text-secondary)' }}>Declarations</div>
                      <div style={{ fontSize:11, fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>We declare that this invoice shows the actual prices of the goods described and that all particulars are true and correct</div>
                    </div>
                    <div style={{ padding:'8px 14px' }}>
                      <div style={{ fontSize:11, fontWeight:900, marginBottom:6 }}>Company's Bank Details</div>
                      {[['Bank Name','STATE BANK OF INDIA'],['A/C No','40487070452'],['Branch/IFSCODE','OTHAKADAI  SBIN0002246']].map(([k,v]) => (
                        <div key={k} style={{ fontSize:11, marginBottom:2, display:'flex', gap:8 }}>
                          <span style={{ fontWeight:700, color:P?'#333':'var(--text-secondary)', minWidth:90 }}>{k}</span>
                          <span style={{ fontWeight:900 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', padding:'8px 16px', borderTop:P?'1px solid #000':'1px solid var(--glass-border)', fontSize:12, fontWeight:900 }}>
                    <span>Customer's Seal and Signature</span>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'#0066cc', fontWeight:900, marginBottom:2 }}>SCAN &amp; PAY</div>
                      <img src={qrCodeImg} alt="QR" style={{ width:70, height:70, display:'block', margin:'0 auto' }} onError={e=>{e.target.style.display='none';}}/>
                    </div>
                    <span>For Muthupandi Fish Farm</span>
                  </div>
                  <div style={{ textAlign:'center', padding:'5px', borderTop:P?'1px solid #000':'1px solid var(--glass-border)', fontSize:11, fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>This is a Computer Generated Invoice</div>
                </>
              ) : (
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 14px', borderTop:P?'1px solid #000':'1px solid var(--glass-border)', fontSize:11, fontWeight:700, color:P?'#333':'var(--text-secondary)' }}>
                  <span>Continued on next page...</span><span>Page {pageNum} of {totalPages}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { handleWhatsAppPDF, generateInvoiceHTML };
export default CreateInvoice;