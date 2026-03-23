// src/components/admin/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { invoiceAPI, productAPI, fishPriceAPI } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ invoices: 0, products: 0, revenue: 0, fishTypes: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      invoiceAPI.getAll(),
      productAPI.getAll(),
      fishPriceAPI.getAll()
    ]).then(([inv, prod, fish]) => {
      const invoices = inv.status === 'fulfilled' ? inv.value.data.data : [];
      const products = prod.status === 'fulfilled' ? prod.value.data.data : [];
      const fishPrices = fish.status === 'fulfilled' ? fish.value.data.data : [];

      const revenue = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
      setStats({
        invoices: invoices.length,
        products: products.length,
        revenue,
        fishTypes: fishPrices.length
      });
      setRecentInvoices(invoices.slice(0, 5));
      setLoading(false);
    });
  }, []);

  const STAT_CARDS = [
    { label: 'Total Invoices', value: stats.invoices, icon: 'bi-receipt', color: 'var(--ocean-light)', bg: 'rgba(6,182,212,0.1)' },
    { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: 'bi-currency-rupee', color: 'var(--gold)', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Products Listed', value: stats.products, icon: 'bi-box-seam', color: 'var(--green-sea)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Fish Types', value: stats.fishTypes, icon: 'bi-water', color: 'var(--coral)', bg: 'rgba(239,68,68,0.1)' },
  ];

  return (
    <div>
      <div className="row g-4 mb-4">
        {STAT_CARDS.map((c, i) => (
          <div key={c.label} className="col-sm-6 col-xl-3">
            <div className="glass-card p-4 d-flex align-items-center gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ width: 56, height: 56, background: c.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: '1.5rem' }} />
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>{c.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: c.color, lineHeight: 1 }}>
                  {loading ? <span className="placeholder" style={{ width: 60, display: 'inline-block', background: 'var(--glass)', borderRadius: 4 }}>...</span> : c.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="glass-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 style={{ fontFamily: 'var(--font-accent)', margin: 0, color: 'var(--ocean-foam)' }}>Recent Invoices</h6>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last 5 transactions</span>
        </div>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm" style={{ color: 'var(--ocean-light)' }} />
          </div>
        ) : recentInvoices.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
            <i className="bi bi-inbox" style={{ fontSize: '2rem' }} />
            <p className="mt-2 mb-0" style={{ fontSize: '0.85rem' }}>No invoices yet. Create your first invoice!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-ocean table-hover mb-0">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Buyer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv._id}>
                    <td><span style={{ color: 'var(--ocean-glow)', fontWeight: 600 }}>#{inv.invoiceNo}</span></td>
                    <td>{inv.buyerName}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td>{inv.items?.length || 0} items</td>
                    <td style={{ color: 'var(--gold-light)', fontWeight: 600 }}>₹{(inv.grandTotal || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                        background: inv.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: inv.paymentStatus === 'Paid' ? '#4ade80' : '#fbbf24',
                        border: `1px solid ${inv.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                      }}>
                        {inv.paymentStatus}
                      </span>
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

export default Dashboard;
