// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductManager from '../components/admin/ProductManager';
import InvoiceManager from '../components/admin/InvoiceManager';
import CreateInvoice from '../components/admin/CreateInvoice';
import FishPriceManager from '../components/admin/FishPriceManager';
import Dashboard from '../components/admin/Dashboard';
import CustomerManager from '../components/admin/CustomerManager';
import AccountingYearManager from '../components/admin/AccountingYearManager';
import SalesReport from '../components/admin/SalesReport';
import AdminUsersManager from '../components/admin/AdminUsersManager';
import LoginPage from './LoginPage';

const MENU = [
  { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { id: 'invoices', icon: 'bi-receipt', label: 'Invoices' },
  { id: 'create-invoice', icon: 'bi-file-plus', label: 'Create Invoice' },
  { id: 'customers', icon: 'bi-people', label: 'Customers' },
  { id: 'products', icon: 'bi-box-seam', label: 'Products' },
  { id: 'fish-prices', icon: 'bi-graph-up-arrow', label: 'Fish Prices' },
  { id: 'sales-report', icon: 'bi-bar-chart-line', label: 'Sales Report' },
  { id: 'accounting-years', icon: 'bi-calendar3', label: 'Accounting Years' },
  { id: 'admin-users', icon: 'bi-shield-lock', label: 'Admin Users' },
];

const AdminPanel = () => {
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editInvoice, setEditInvoice] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const name = localStorage.getItem('admin_name');
    const username = localStorage.getItem('admin_username');
    if (token && name) setUser({ token, name, username });
  }, []);

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_username');
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderPage = () => {
    switch (active) {
      case 'dashboard': return <Dashboard />;
      case 'invoices': return <InvoiceManager onNew={() => setActive('create-invoice')} />;
      case 'create-invoice': return <CreateInvoice editData={editInvoice} onSaved={() => { setEditInvoice(null); setActive('invoices'); }} />;
      case 'customers': return <CustomerManager />;
      case 'products': return <ProductManager />;
      case 'fish-prices': return <FishPriceManager />;
      case 'sales-report': return <SalesReport />;
      case 'accounting-years': return <AccountingYearManager />;
      case 'admin-users': return <AdminUsersManager />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ocean-deep)' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 72, background: 'var(--ocean-mid)',
        borderRight: '1px solid var(--glass-border)', minHeight: '100vh',
        transition: 'width 0.3s ease', flexShrink: 0, display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🐟</span>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--ocean-glow)', whiteSpace: 'nowrap' }}>MUTHUPANDI</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '2px', whiteSpace: 'nowrap' }}>ADMIN PANEL</div>
            </div>
          )}
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '12px 20px', cursor: 'pointer', textAlign: sidebarOpen ? 'right' : 'center', fontSize: '1rem' }}>
          <i className={`bi ${sidebarOpen ? 'bi-chevron-double-left' : 'bi-chevron-double-right'}`} />
        </button>

        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {MENU.map(item => (
            <div
              key={item.id}
              className={`admin-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => setActive(item.id)}
              title={!sidebarOpen ? item.label : ''}
              style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', overflow: 'hidden' }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
          {sidebarOpen && user && (
            <div style={{ marginBottom: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '6px 8px' }}>
              <i className="bi bi-person-circle me-2" />{user.name}
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, color: 'var(--coral)',
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '8px',
            borderRadius: 8, justifyContent: sidebarOpen ? 'flex-start' : 'center', width: '100%'
          }}>
            <i className="bi bi-box-arrow-left" style={{ fontSize: '1rem' }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
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
        <div style={{
          background: 'rgba(4,31,59,0.9)', borderBottom: '1px solid var(--glass-border)',
          padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100
        }}>
          <div>
            <h5 style={{ margin: 0, fontFamily: 'var(--font-accent)', color: 'var(--ocean-foam)' }}>
              {MENU.find(m => m.id === active)?.label}
            </h5>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Muthupandi Fish Farm — Admin Panel</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <i className="bi bi-calendar3 me-2" />
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', color: 'var(--ocean-light)' }}>
              <i className="bi bi-person-circle me-2" />{user?.name}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
