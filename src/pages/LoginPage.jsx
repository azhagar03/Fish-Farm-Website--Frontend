// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { adminAPI } from '../services/api';

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.login(form);
      const { token, name, username } = res.data.data;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_name', name);
      localStorage.setItem('admin_username', username);
      onLogin({ token, name, username });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--ocean-deep)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background bubbles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${20 + i * 15}px`, height: `${20 + i * 15}px`,
          borderRadius: '50%', background: 'rgba(6,182,212,0.06)',
          border: '1px solid rgba(6,182,212,0.15)',
          bottom: `${-50 + i * 5}%`,
          left: `${5 + i * 12}%`,
          animation: `bubble-rise ${6 + i * 2}s ease-in infinite`,
          animationDelay: `${i * 0.8}s`
        }} />
      ))}

      <div style={{
        background: 'rgba(4,31,59,0.95)', border: '1px solid var(--glass-border)',
        borderRadius: 20, padding: '48px 40px', width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.1)',
        position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🐟</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ocean-foam)', fontSize: '1.3rem', margin: 0 }}>
            MUTHUPANDI FISH FARM
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '6px 0 0' }}>Admin Panel Login</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 6 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-person" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ocean-light)', fontSize: '1rem' }} />
              <input
                type="text"
                className="form-control input-ocean"
                style={{ paddingLeft: 36 }}
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ocean-light)', fontSize: '1rem' }} />
              <input
                type="password"
                className="form-control input-ocean"
                style={{ paddingLeft: 36 }}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem'
            }}>
              <i className="bi bi-exclamation-triangle me-2" />{error}
            </div>
          )}

          <button
            type="submit"
            className="btn-ocean btn w-100"
            disabled={loading}
            style={{ padding: '12px', fontSize: '1rem', fontWeight: 700 }}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Logging in...</>
              : <><i className="bi bi-box-arrow-in-right me-2" />Login</>
            }
          </button>
        </form>

  
      </div>
    </div>
  );
};

export default LoginPage;
