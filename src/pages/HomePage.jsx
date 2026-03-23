// src/pages/HomePage.jsx - Complete one-page website
import React, { useEffect, useState, useRef } from 'react';
import PriceTicker from '../components/PriceTicker';
import { fishPriceAPI ,productAPI } from '../services/api';

/* ─── Fish data for gallery ────────────────────────────────────────────────── */

const SERVICES = [
  { icon: '🏊', title: 'Aquarium Setup', desc: 'Complete aquarium design and installation for homes, offices, and restaurants. Custom sizes available.' },
  { icon: '🚚', title: 'Live Fish Delivery', desc: 'Safe and healthy delivery of live fish across Tamilnadu. Packed in oxygen-sealed bags.' },
  { icon: '💊', title: 'Fish Health Care', desc: 'Expert diagnosis and treatment for fish diseases. Medicines and health supplements available.' },
  { icon: '🔧', title: 'Equipment & Filters', desc: 'Premium filters, heaters, aerators, lighting and all aquarium accessories.' },
  { icon: '🌿', title: 'Aquatic Plants', desc: 'Live aquatic plants for natural filtration and beautiful aquascape designs.' },
  { icon: '🎓', title: 'Fish Farming Training', desc: 'Professional training for commercial aquaculture and ornamental fish breeding.' },
];

const STATS = [
  { number: '500+', label: 'Fish Species' },
  { number: '15+', label: 'Years Experience' },
  { number: '10K+', label: 'Happy Customers' },
  { number: '50+', label: 'Awards Won' },
];

/* ─── useIntersection hook for scroll animations ───────────────────────────── */
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ─── Section Wrapper with scroll animation ─────────────────────────────────── */
const AnimSection = ({ id, children, className = '' }) => {
  const [ref, inView] = useInView();
  return (
    <section
      id={id}
      ref={ref}
      className={className}
      style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}
    >
      {children}
    </section>
  );
};

/* ─── HomePage Component ─────────────────────────────────────────────────────── */
const HomePage = () => {
  const [livePrices, setLivePrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
const [products, setProducts] = useState([]);
const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    fishPriceAPI.getAll()
      .then(res => setLivePrices(res.data.data || []))
      .catch(() => setLivePrices([
        { _id: '1', fishName: 'Arowana (Golden)', category: 'Ornamental', currentPrice: 5000, previousPrice: 4800, priceChange: 4.17, unit: 'per piece', availability: 'Limited', origin: 'Malaysia' },
        { _id: '2', fishName: 'Flowerhorn', category: 'Ornamental', currentPrice: 1200, previousPrice: 1250, priceChange: -4.0, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '3', fishName: 'Oscar Fish', category: 'Tropical', currentPrice: 150, previousPrice: 140, priceChange: 7.14, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '4', fishName: 'Discus Fish', category: 'Tropical', currentPrice: 800, previousPrice: 820, priceChange: -2.44, unit: 'per piece', availability: 'Limited', origin: 'Brazil' },
        { _id: '5', fishName: 'Koi Fish', category: 'Coldwater', currentPrice: 500, previousPrice: 480, priceChange: 4.17, unit: 'per piece', availability: 'In Stock', origin: 'Japan' },
        { _id: '6', fishName: 'Betta (Fighting)', category: 'Tropical', currentPrice: 100, previousPrice: 100, priceChange: 0, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '7', fishName: 'Goldfish (Fancy)', category: 'Coldwater', currentPrice: 80, previousPrice: 75, priceChange: 6.67, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '8', fishName: 'Clownfish', category: 'Marine', currentPrice: 350, previousPrice: 360, priceChange: -2.78, unit: 'per piece', availability: 'Limited', origin: 'Marine' },
        { _id: '9', fishName: 'Angelfish', category: 'Tropical', currentPrice: 120, previousPrice: 115, priceChange: 4.35, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '10', fishName: 'Guppy (Pair)', category: 'Tropical', currentPrice: 40, previousPrice: 40, priceChange: 0, unit: 'per pair', availability: 'In Stock', origin: 'Local' },
        { _id: '11', fishName: 'Rohu', category: 'Food Fish', currentPrice: 180, previousPrice: 190, priceChange: -5.26, unit: 'per kg', availability: 'In Stock', origin: 'Local' },
        { _id: '12', fishName: 'Catla', category: 'Food Fish', currentPrice: 200, previousPrice: 195, priceChange: 2.56, unit: 'per kg', availability: 'In Stock', origin: 'Local' },
      ]))
      .finally(() => setPricesLoading(false));
  }, []);

  useEffect(() => {
  productAPI.getAll()
    .then(res => setProducts(res.data.data || []))
    .catch(() => setProducts([]))
    .finally(() => setProductsLoading(false));
}, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
    setContactForm({ name: '', phone: '', message: '' });
  };

  const availabilityColor = (a) => a === 'In Stock' ? '#4ade80' : a === 'Limited' ? '#fbbf24' : '#f87171';

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* <PriceTicker /> */}

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section id="home" className="hero-section">
        <div className="hero-bg-overlay" />

        {/* Decorative fish swimming */}
        <div style={{ position: 'absolute', fontSize: '3rem', animation: 'swim 20s linear infinite', top: '30%', zIndex: 0, pointerEvents: 'none' }}>🐠</div>
        <div style={{ position: 'absolute', fontSize: '2rem', animation: 'swim 28s linear infinite 8s', top: '60%', zIndex: 0, pointerEvents: 'none' }}>🐡</div>

        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center min-vh-100 py-5">
            <div className="col-lg-7">
              <div style={{ color: 'var(--ocean-light)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px', animation: 'fadeInUp 0.8s ease both' }}>
                🌊 Madurai's Premier Aquatic Hub
              </div>
              <h1 className="hero-title mb-4">
                <span className="highlight">MUTHUPANDI</span><br />
                Fish Farm
              </h1>
              <p className="hero-subtitle mb-5" style={{ maxWidth: '540px' }}>
                Premium ornamental & food fish, aquarium equipment, live fish delivery and expert aquaculture services from the heart of Madurai, Tamil Nadu.
              </p>
              <div className="d-flex flex-wrap gap-3" style={{ animation: 'fadeInUp 1s ease 0.6s both' }}>
                <a href="#gallery" className="btn-ocean btn">
                  <i className="bi bi-collection me-2" />Explore Fish Gallery
                </a>
                <a href="#prices" className="btn-gold btn">
                  <i className="bi bi-graph-up me-2" />Live Market Prices
                </a>
              </div>

              {/* Quick stats */}
              <div className="d-flex flex-wrap gap-4 mt-5" style={{ animation: 'fadeInUp 1s ease 0.9s both' }}>
                {STATS.map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ocean-glow)', lineHeight: 1 }}>{s.number}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-5 d-none d-lg-flex justify-content-center" style={{ animation: 'float 5s ease-in-out infinite' }}>
              <div style={{
                width: 380, height: 380,
                background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.05) 60%, transparent 100%)',
                border: '1px solid rgba(6,182,212,0.2)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12rem',
                animation: 'pulse-glow 3s ease infinite'
              }}>
                🐟
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="wave-container">
          <div className="wave" />
        </div>
      </section>

      {/* ─── ABOUT ─────────────────────────────────────────────────────────── */}
      <AnimSection id="about" className="py-5" style={{}}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <div className="glass-card p-4 text-center" style={{ borderRadius: 24 }}>
                <div style={{ fontSize: '6rem', marginBottom: '16px', animation: 'float 4s ease infinite' }}>🏪</div>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ocean-glow)', fontSize: '1.1rem' }}>Sri Pandia Chinnaiya</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Established • Trusted • Premium</p>
                <div style={{ background: 'var(--glass)', borderRadius: 12, padding: '16px', marginBottom: '12px' }}>
                  <i className="bi bi-geo-alt-fill me-2" style={{ color: 'var(--ocean-light)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--ocean-foam)' }}>6/201 ITI Colony, Aathikulam, K.Pudur - Madurai 7, Tamilnadu</span>
                </div>
                <div style={{ background: 'var(--glass)', borderRadius: 12, padding: '16px', marginBottom: '12px' }}>
                  <i className="bi bi-telephone-fill me-2" style={{ color: 'var(--green-sea)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--ocean-foam)' }}>9842186330 &nbsp;|&nbsp; 9842886330</span>
                </div>
                <div style={{ background: 'var(--glass)', borderRadius: 12, padding: '16px' }}>
                  <i className="bi bi-award-fill me-2" style={{ color: 'var(--gold)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--ocean-foam)' }}>GSTIN: 33ARIPM4129M1ZK</span>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div style={{ color: 'var(--ocean-light)', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Our Story</div>
              <h2 className="section-title">About Muthupandi Fish Farm</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8 }}>
                Located in the heart of Madurai, Muthupandi Fish Farm has been a trusted name in aquatic life for over 15 years. We specialize in premium ornamental fish, aquarium equipment, and professional fish farming consultancy.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, marginTop: '16px' }}>
                From rare Arowanas and vibrant Flowerhorns to everyday Goldfish and Guppies — our farm offers an unmatched variety of healthy, disease-free fish. Every fish is bred and nurtured with care under optimal conditions.
              </p>
              <div className="row g-3 mt-3">
                {[
                  { icon: 'bi-droplet-fill', text: 'Clean Water Guaranteed', color: 'var(--ocean-light)' },
                  { icon: 'bi-heart-fill', text: 'Disease-Free Fish', color: 'var(--coral)' },
                  { icon: 'bi-truck', text: 'Pan-Tamilnadu Delivery', color: 'var(--green-sea)' },
                  { icon: 'bi-currency-rupee', text: 'Best Market Rates', color: 'var(--gold)' },
                ].map(f => (
                  <div key={f.text} className="col-6">
                    <div className="glass-card d-flex align-items-center gap-2 p-3">
                      <i className={`bi ${f.icon}`} style={{ color: f.color, fontSize: '1.2rem' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimSection>

      {/* ─── FISH GALLERY ───────────────────────────────────────────────────── */}
      <AnimSection id="gallery" className="py-5" style={{ background: 'linear-gradient(180deg, var(--ocean-deep) 0%, rgba(4,31,59,0.5) 100%)' }}>
        <div className="container py-5">
          <div className="text-center mb-5">
            <div style={{ color: 'var(--ocean-light)', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Our Collection</div>
            <h2 className="section-title">Premium Fish Gallery</h2>
            <p className="section-subtitle">Carefully curated aquatic species for every enthusiast</p>
          </div>
          <div className="row g-4">
         {productsLoading ? (
  <div className="text-center py-5">
    <div className="spinner-border text-light" />
  </div>
) : (
  products.map((fish, i) => (
    <div key={fish._id || i} className="col-sm-6 col-lg-3">
      <div className="fish-card h-100">

        {/* Optional image if available */}
        {fish.image ? (
          <img
            src={fish.image}
            alt={fish.name}
            style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 12 }}
          />
        ) : (
          <div className="fish-emoji">🐟</div>
        )}

        <div className="p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 style={{ fontWeight: 700 }}>
              {fish.name}
            </h6>

            <span style={{
              background: 'rgba(6,182,212,0.15)',
              color: 'var(--ocean-glow)',
              fontSize: '0.65rem',
              padding: '2px 8px',
              borderRadius: 20
            }}>
              {fish.category || 'Fish'}
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {fish.description || 'Premium quality fish available.'}
          </p>

          <div className="price-badge">
            ₹{fish.price?.toLocaleString('en-IN') || '---'}
          </div>
        </div>
      </div>
    </div>
  ))
)}
          </div>
        </div>
      </AnimSection>

      {/* ─── LIVE PRICES ─────────────────────────────────────────────────────── */}
      <AnimSection id="prices" className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <div style={{ color: 'var(--gold)', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
              <span style={{ animation: 'pulse-glow 1.5s ease infinite', display: 'inline-block', width: 8, height: 8, background: '#4ade80', borderRadius: '50%', marginRight: 8 }} />
              Updated Today
            </div>
            <h2 className="section-title">Live Fish Market Prices</h2>
            <p className="section-subtitle">Real-time pricing from Muthupandi Fish Farm, Madurai</p>
          </div>

          {pricesLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--ocean-light)', width: '3rem', height: '3rem' }} />
              <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading live prices...</p>
            </div>
          ) : (
            <div className="row g-3">
              {livePrices.map((p, i) => (
                <div key={p._id || i} className="col-sm-6 col-md-4 col-lg-3">
                  <div className="glass-card p-3 h-100" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{p.fishName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.category} • {p.origin}</div>
                      </div>
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20,
                        background: `${availabilityColor(p.availability)}22`,
                        color: availabilityColor(p.availability),
                        border: `1px solid ${availabilityColor(p.availability)}44`,
                        whiteSpace: 'nowrap'
                      }}>{p.availability}</span>
                    </div>

                    <div className="mt-3 d-flex align-items-end justify-content-between">
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold-light)', lineHeight: 1 }}>
                          ₹{p.currentPrice.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.unit}</div>
                      </div>
                      {p.priceChange !== 0 && (
                        <span className={`${p.priceChange > 0 ? 'price-up' : 'price-down'}`} style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          {p.priceChange > 0 ? '▲' : '▼'} {Math.abs(p.priceChange)}%
                        </span>
                      )}
                      {p.priceChange === 0 && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>─ Stable</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-4">
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              <i className="bi bi-info-circle me-1" />
              Prices are subject to availability. Contact us for bulk orders and special rates.
            </small>
          </div>
        </div>
      </AnimSection>

      {/* ─── SERVICES ─────────────────────────────────────────────────────────── */}
      <AnimSection id="services" className="py-5" style={{ background: 'linear-gradient(180deg, rgba(4,31,59,0.3) 0%, var(--ocean-deep) 100%)' }}>
        <div className="container py-5">
          <div className="text-center mb-5">
            <div style={{ color: 'var(--ocean-light)', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>What We Offer</div>
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">Comprehensive aquatic solutions for every need</p>
          </div>
          <div className="row g-4">
            {SERVICES.map((s, i) => (
              <div key={s.title} className="col-sm-6 col-lg-4">
                <div className="glass-card p-4 h-100 text-center" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px', animation: `float ${3 + i * 0.3}s ease infinite` }}>{s.icon}</div>
                  <h5 style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, color: 'var(--ocean-foam)', marginBottom: '12px' }}>{s.title}</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimSection>

      {/* ─── CONTACT ──────────────────────────────────────────────────────────── */}
      <AnimSection id="contact" className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <div style={{ color: 'var(--ocean-light)', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Get In Touch</div>
            <h2 className="section-title">Contact Us</h2>
            <p className="section-subtitle">We'd love to help you set up your dream aquarium</p>
          </div>
          <div className="row g-5 justify-content-center">
            <div className="col-lg-5">
              <div className="glass-card p-4">
                <h5 style={{ fontFamily: 'var(--font-accent)', color: 'var(--ocean-glow)', marginBottom: '24px' }}>Send a Message</h5>
                {contactSent && (
                  <div className="alert" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#4ade80', borderRadius: 12 }}>
                    <i className="bi bi-check-circle me-2" />Message sent! We'll get back to you shortly.
                  </div>
                )}
                <form onSubmit={handleContactSubmit}>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Your Name</label>
                    <input className="form-control input-ocean" placeholder="Enter your name" required
                      value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone Number</label>
                    <input className="form-control input-ocean" placeholder="+91 XXXXX XXXXX" type="tel"
                      value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Message</label>
                    <textarea className="form-control input-ocean" rows="4" placeholder="Tell us what you need..." required
                      value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} />
                  </div>
                  <button type="submit" className="btn-ocean btn w-100">
                    <i className="bi bi-send me-2" />Send Message
                  </button>
                </form>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="glass-card p-4 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 48, height: 48, background: 'rgba(6,182,212,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-geo-alt-fill" style={{ color: 'var(--ocean-light)', fontSize: '1.2rem' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Address</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>6/201 ITI Colony, Aathikulam,<br />K.Pudur - Madurai 7, Tamilnadu</div>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 48, height: 48, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-telephone-fill" style={{ color: 'var(--green-sea)', fontSize: '1.2rem' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Phone</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>9842186330<br />9842886330</div>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 48, height: 48, background: 'rgba(245,158,11,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-clock-fill" style={{ color: 'var(--gold)', fontSize: '1.2rem' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Working Hours</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Mon–Sat: 8:00 AM – 8:00 PM<br />Sunday: 9:00 AM – 5:00 PM</div>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4">
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px' }}>Follow Us</div>
                <div className="d-flex gap-2">
                  {['facebook', 'instagram', 'youtube', 'whatsapp'].map(s => (
                    <a key={s} href="#" style={{
                      width: 40, height: 40, background: 'var(--glass)', border: '1px solid var(--glass-border)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--ocean-light)', textDecoration: 'none', transition: 'all 0.2s'
                    }}>
                      <i className={`bi bi-${s}`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimSection>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--ocean-mid)', borderTop: '1px solid var(--glass-border)', padding: '32px 0' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <div className="navbar-brand-text" style={{ fontSize: '1.1rem' }}>🐟 MUTHUPANDI FISH FARM</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                6/201 ITI Colony, Aathikulam, K.Pudur - Madurai 7, Tamilnadu
              </div>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                GSTIN: 33ARIPM4129M1ZK | State Code: 33
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                © 2024 Muthupandi Fish Farm. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
