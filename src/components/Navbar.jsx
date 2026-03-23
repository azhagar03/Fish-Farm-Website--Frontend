// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'HOME', href: '#home' },
    { label: 'ABOUT', href: '#about' },
    { label: 'FISH GALLERY', href: '#gallery' },
    { label: 'LIVE PRICES', href: '#prices' },
    { label: 'SERVICES', href: '#services' },
    { label: 'CONTACT', href: '#contact' },
  ];

  return (
    <nav
      className="navbar-custom navbar navbar-expand-lg"
      style={{ boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none' }}
    >
      <div className="container">
        {/* Brand */}
        <a href="#home" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
          <span style={{ fontSize: '1.8rem' }}>🐟</span>
          <div>
            <div className="navbar-brand-text" style={{ lineHeight: 1 }}>MUTHUPANDI</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--ocean-light)', letterSpacing: '3px', fontWeight: 600 }}>
              FISH FARM
            </div>
          </div>
        </a>

        {/* Toggle */}
        <button
          className="navbar-toggler border-0"
          style={{ color: 'var(--ocean-light)' }}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`} style={{ fontSize: '1.5rem' }} />
        </button>

        {/* Links */}
        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto align-items-center gap-1">
            {navLinks.map(link => (
              <li key={link.label} className="nav-item">
                <a
                  href={link.href}
                  className="nav-link-custom nav-link fw-bold"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="nav-item ms-2">
              <Link
                to="/admin"
                className="btn-gold btn"
                style={{ fontSize: '0.8rem', padding: '8px 20px' }}
              >
                <i className="bi bi-shield-lock me-1" />
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
