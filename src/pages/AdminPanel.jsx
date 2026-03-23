// src/pages/AdminPanel.jsx - Full Admin Panel with sidebar navigation
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductManager from '../components/admin/ProductManager';
import InvoiceManager from '../components/admin/InvoiceManager';
import CreateInvoice from '../components/admin/CreateInvoice';
import FishPriceManager from '../components/admin/FishPriceManager';
import Dashboard from '../components/admin/Dashboard';

const MENU = [
  { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { id: 'invoices', icon: 'bi-receipt', label: 'Invoices' },
  { id: 'create-invoice', icon: 'bi-file-plus', label: 'Create Invoice' },
  { id: 'products', icon: 'bi-box-seam', label: 'Products' },
  { id: 'fish-prices', icon: 'bi-graph-up-arrow', label: 'Fish Prices' },
];

const AdminPanel = () => {
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (active) {
      case 'dashboard': return <Dashboard />;
      case 'invoices': return <InvoiceManager onNew={() => setActive('create-invoice')} />;
      case 'create-invoice': return <CreateInvoice onSaved={() => setActive('invoices')} />;
      case 'products': return <ProductManager />;
      case 'fish-prices': return <FishPriceManager />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ocean-deep)' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 72,
        background: 'var(--ocean-mid)',
        borderRight: '1px solid var(--glass-border)',
        minHeight: '100vh',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🐟</span>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--ocean-glow)', whiteSpace: 'nowrap' }}>MUTHUPANDI</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '2px', whiteSpace: 'nowrap' }}>ADMIN PANEL</div>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '12px 20px', cursor: 'pointer', textAlign: sidebarOpen ? 'right' : 'center', fontSize: '1rem' }}
        >
          <i className={`bi ${sidebarOpen ? 'bi-chevron-double-left' : 'bi-chevron-double-right'}`} />
        </button>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {MENU.map(item => (
            <div
              key={item.id}
              className={`admin-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => setActive(item.id)}
              title={!sidebarOpen ? item.label : ''}
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', overflow: 'hidden' }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Back to site */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)',
            textDecoration: 'none', fontSize: '0.85rem', padding: '8px',
            borderRadius: 8, justifyContent: sidebarOpen ? 'flex-start' : 'center'
          }}>
            <i className="bi bi-arrow-left-circle" style={{ fontSize: '1rem' }} />
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{
          background: 'rgba(4,31,59,0.9)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 100
        }}>
          <div>
            <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>
              {MENU.find(m => m.id === active)?.label}
            </h5>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Muthupandi Fish Farm — Admin Panel
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)'
            }}>
              <i className="bi bi-calendar3 me-2" />
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '24px' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
