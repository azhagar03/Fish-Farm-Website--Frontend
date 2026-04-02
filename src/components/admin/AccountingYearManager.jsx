// src/components/admin/AccountingYearManager.jsx
import React, { useEffect, useState } from 'react';
import { accountingYearAPI } from '../../services/api';

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const AccountingYearManager = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [newStartYear, setNewStartYear] = useState(new Date().getFullYear());
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await accountingYearAPI.getAll();
      const data = res.data.data || [];
      setYears(data);
      const active = data.find(y => y.isActive);
      if (active && !selectedYear) {
        setSelectedYear(active);
        loadRevenue(active._id);
      }
    } catch { showToast('Error loading years', 'error'); }
    setLoading(false);
  };

  const loadRevenue = async (id) => {
    setRevenueLoading(true);
    try {
      const res = await accountingYearAPI.getRevenue(id);
      setRevenueData(res.data.data);
    } catch { showToast('Error loading revenue data', 'error'); }
    setRevenueLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSelectYear = (year) => {
    setSelectedYear(year);
    loadRevenue(year._id);
  };

  const handleActivate = async (id) => {
    const year = years.find(y => y._id === id);

    // invoiceCounter === 0 or undefined means fresh year → will restart from 1
    const isFreshYear = !year?.invoiceCounter || year.invoiceCounter === 0;

    const confirmMsg = isFreshYear
      ? `⚠️ Switch to FY ${year?.label}?\n\nInvoice numbers will RESTART from #1 for this new year.\n\nThis cannot be undone. Are you sure?`
      : `Switch to FY ${year?.label}?\n\nInvoice numbers will continue from #${(year.invoiceCounter || 0) + 1}.\n\nAre you sure?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await accountingYearAPI.activate(id);

      showToast(
        isFreshYear
          ? `✓ FY ${year?.label} activated — invoices will start from #1`
          : `✓ FY ${year?.label} activated — continuing from #${(year.invoiceCounter || 0) + 1}`,
        'success'
      );

      // Reload to get updated counters
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error activating year', 'error');
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await accountingYearAPI.create({ startYear: parseInt(newStartYear), setActive: false });
      showToast(`FY ${newStartYear}-${parseInt(newStartYear) + 1} created — activate it when ready to start invoicing from #1`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating year', 'error');
    }
    setCreating(false);
  };

  const maxRevenue = revenueData ? Math.max(...revenueData.monthlyData.map(m => m.revenue), 1) : 1;

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)',
          color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', maxWidth: 380
        }}>
          <i className={`bi ${toast.type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2`} />{toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>Accounting Years</h5>
          <small style={{ color: 'var(--text-secondary)' }}>Financial year: April to March • Revenue tracking • Invoice number control</small>
        </div>
      </div>

      {/* Info banner about invoice numbering */}
      <div className="glass-card p-3 mb-4" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <div className="d-flex align-items-start gap-3">
          <i className="bi bi-info-circle" style={{ color: '#fbbf24', fontSize: '1.2rem', marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.88rem', marginBottom: 4 }}>Invoice Number Control</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              • <strong style={{ color: 'var(--ocean-light)' }}>Activating a new year</strong> resets invoice numbers back to <strong style={{ color: '#4ade80' }}>#1</strong>.<br/>
              • <strong style={{ color: 'var(--ocean-light)' }}>Switching back</strong> to a previous year continues from where it left off.<br/>
              • The backend's <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: 3, fontSize: '0.75rem' }}>invoiceCounter</code> per year tracks this automatically.<br/>
              • Make sure your backend's <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: 3, fontSize: '0.75rem' }}>invoiceAPI.create</code> reads the <strong>active year's counter</strong> when generating invoice numbers.
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left: Year list + Create */}
        <div className="col-lg-4">
          {/* Create New Year */}
          <div className="glass-card p-4 mb-4">
            <h6 style={{ color: 'var(--ocean-glow)', marginBottom: 16 }}><i className="bi bi-plus-circle me-2" />Add Accounting Year</h6>
            <div className="d-flex gap-2 align-items-end">
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Start Year</label>
                <input
                  type="number"
                  className="form-control input-ocean"
                  value={newStartYear}
                  onChange={e => setNewStartYear(e.target.value)}
                  min={2020} max={2100}
                />
              </div>
              <button className="btn-ocean btn" onClick={handleCreate} disabled={creating}>
                {creating ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-plus-lg me-1" />Create</>}
              </button>
            </div>
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 6, display: 'block' }}>
              Creates FY {newStartYear}–{parseInt(newStartYear) + 1} (Apr–Mar) • Activate to start invoices from #1
            </small>
          </div>

          {/* Year List */}
          <div className="glass-card p-3">
            <h6 style={{ color: 'var(--ocean-glow)', marginBottom: 12 }}>
              <i className="bi bi-calendar3 me-2" />All Years
            </h6>
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" style={{ color: 'var(--ocean-light)' }} />
              </div>
            ) : years.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No years found. Create one above.</p>
            ) : years.map(year => (
              <div
                key={year._id}
                onClick={() => handleSelectYear(year)}
                style={{
                  padding: '12px 14px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                  background: selectedYear?._id === year._id ? 'rgba(6,182,212,0.15)' : 'rgba(4,31,59,0.5)',
                  border: `1px solid ${selectedYear?._id === year._id ? 'rgba(6,182,212,0.4)' : 'var(--glass-border)'}`,
                  transition: 'all 0.2s'
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  {/* LEFT: Year info */}
                  <div>
                    <div style={{ fontWeight: 700, color: year.isActive ? 'var(--gold)' : 'var(--ocean-foam)', fontSize: '0.95rem' }}>
                      FY {year.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Apr {year.startYear} – Mar {year.endYear}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ocean-light)', marginTop: 4 }}>
                      <i className="bi bi-hash me-1" />
                      {year.invoiceCounter ?? 0} invoice{(year.invoiceCounter ?? 0) !== 1 ? 's' : ''} issued
                    </div>
                    {/* Next invoice number preview */}
                    <div style={{ fontSize: '0.7rem', marginTop: 2 }}>
                      {year.isActive ? (
                        <span style={{ color: '#4ade80', fontWeight: 700 }}>
                          Next: #{(year.invoiceCounter ?? 0) + 1}
                        </span>
                      ) : (!year.invoiceCounter || year.invoiceCounter === 0) ? (
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                          Will restart from #1 when activated
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Will continue from #{(year.invoiceCounter ?? 0) + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Active badge or Set Active button */}
                  <div className="d-flex flex-column align-items-end gap-2">
                    {year.isActive ? (
                      <span style={{
                        background: 'rgba(16,185,129,0.2)', color: '#4ade80',
                        border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12,
                        padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700
                      }}>
                        ● ACTIVE
                      </span>
                    ) : (
                      <button
                        className="btn btn-sm"
                        style={{
                          background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)',
                          color: 'var(--ocean-light)', fontSize: '0.72rem', padding: '3px 10px', borderRadius: 8,
                          fontWeight: 600
                        }}
                        onClick={e => { e.stopPropagation(); handleActivate(year._id); }}
                      >
                        <i className="bi bi-lightning me-1" />Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Revenue Chart */}
        <div className="col-lg-8">
          {selectedYear ? (
            <div className="glass-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                  <h6 style={{ color: 'var(--ocean-glow)', margin: 0 }}>
                    <i className="bi bi-bar-chart-line me-2" />Revenue — FY {selectedYear.label}
                  </h6>
                  <small style={{ color: 'var(--text-secondary)' }}>Monthly breakdown (April to March)</small>
                </div>
                {revenueData && (
                  <div className="d-flex gap-3 flex-wrap">
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Revenue</div>
                      <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.1rem' }}>
                        ₹{Number(revenueData.totalRevenue || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total GST</div>
                      <div style={{ color: 'var(--ocean-glow)', fontWeight: 700, fontSize: '1.1rem' }}>
                        ₹{Number(revenueData.totalGst || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Invoices</div>
                      <div style={{ color: 'var(--ocean-light)', fontWeight: 700, fontSize: '1.1rem' }}>
                        {revenueData.invoiceCount}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {revenueLoading ? (
                <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--ocean-light)' }} /></div>
              ) : revenueData ? (
                <>
                  {/* Bar Chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, marginBottom: 24, padding: '0 4px' }}>
                    {revenueData.monthlyData.map((m, i) => {
                      const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}>
                            {m.revenue > 0 ? `₹${(m.revenue / 1000).toFixed(0)}K` : ''}
                          </div>
                          <div
                            style={{
                              width: '100%',
                              background: m.revenue > 0
                                ? 'linear-gradient(180deg, rgba(6,182,212,0.9), rgba(6,182,212,0.4))'
                                : 'rgba(6,182,212,0.08)',
                              borderRadius: '4px 4px 0 0',
                              height: `${Math.max(pct, m.revenue > 0 ? 4 : 0)}%`,
                              minHeight: m.revenue > 0 ? 4 : 0,
                              border: '1px solid rgba(6,182,212,0.3)',
                              transition: 'height 0.5s ease',
                              cursor: 'default',
                            }}
                            title={`${m.month}: ₹${m.revenue.toLocaleString('en-IN')}\nGST: ₹${m.gst.toLocaleString('en-IN')}\nInvoices: ${m.count}`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Month Labels */}
                  <div style={{ display: 'flex', gap: 6, padding: '0 4px', marginBottom: 20 }}>
                    {MONTHS.map((m, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-secondary)', overflow: 'hidden' }}>
                        {m.slice(0, 3)}
                      </div>
                    ))}
                  </div>

                  {/* Monthly Table */}
                  <div className="table-responsive">
                    <table className="table table-ocean mb-0" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th className="text-end">Revenue</th>
                          <th className="text-end">GST</th>
                          <th className="text-end">Invoices</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.monthlyData.map((m, i) => (
                          <tr key={i} style={{ opacity: m.count === 0 ? 0.4 : 1 }}>
                            <td style={{ color: 'var(--ocean-foam)' }}>{m.month}</td>
                            <td className="text-end" style={{ color: 'var(--gold-light)', fontWeight: m.revenue > 0 ? 700 : 400 }}>
                              {m.revenue > 0 ? `₹${m.revenue.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="text-end" style={{ color: 'var(--ocean-light)' }}>
                              {m.gst > 0 ? `₹${m.gst.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="text-end" style={{ color: 'var(--text-secondary)' }}>{m.count}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid var(--glass-border)' }}>
                          <td style={{ fontWeight: 800, color: 'var(--ocean-glow)' }}>TOTAL</td>
                          <td className="text-end" style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.95rem' }}>
                            ₹{Number(revenueData.totalRevenue).toLocaleString('en-IN')}
                          </td>
                          <td className="text-end" style={{ fontWeight: 700, color: 'var(--ocean-glow)' }}>
                            ₹{Number(revenueData.totalGst).toLocaleString('en-IN')}
                          </td>
                          <td className="text-end" style={{ fontWeight: 700, color: 'var(--ocean-light)' }}>
                            {revenueData.invoiceCount}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="glass-card p-5 text-center" style={{ color: 'var(--text-secondary)' }}>
              <i className="bi bi-calendar3" style={{ fontSize: '3rem', display: 'block', marginBottom: 12, color: 'var(--ocean-light)' }} />
              Select a year to view revenue breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingYearManager;