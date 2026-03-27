// src/pages/HomePage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { fishPriceAPI, productAPI } from '../services/api';

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
const ITEMS_PER_PAGE = 20;

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
const AnimSection = ({ id, children, className = '' }) => {
  const [ref, inView] = useInView();
  return (
    <section id={id} ref={ref} className={className}
      style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(40px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
      {children}
    </section>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <div className="d-flex justify-content-center align-items-center gap-2 mt-4 flex-wrap">
      <button className="btn btn-sm"
        style={{ background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--ocean-light)', borderRadius: 8, padding: '6px 14px' }}
        onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <i className="bi bi-chevron-left" />
      </button>
      {pages.map(p => (
        <button key={p} className="btn btn-sm"
          style={{ background: p === currentPage ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${p === currentPage ? 'rgba(6,182,212,0.6)' : 'rgba(255,255,255,0.1)'}`, color: p === currentPage ? 'var(--ocean-foam)' : 'var(--text-secondary)', borderRadius: 8, padding: '6px 12px', fontWeight: p === currentPage ? 700 : 400, minWidth: 38 }}
          onClick={() => onPageChange(p)}>{p}</button>
      ))}
      <button className="btn btn-sm"
        style={{ background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--ocean-light)', borderRadius: 8, padding: '6px 14px' }}
        onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        <i className="bi bi-chevron-right" />
      </button>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 8 }}>Page {currentPage} of {totalPages}</span>
    </div>
  );
};

const HomePage = () => {
  const [livePrices, setLivePrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [galleryPage, setGalleryPage] = useState(1);
  const [marketPage, setMarketPage] = useState(1);

  useEffect(() => {
    fishPriceAPI.getAll()
      .then(res => setLivePrices(res.data.data || []))
      .catch(() => setLivePrices([
        { _id: '1', fishName: 'Arowana (Golden)', category: 'Ornamental', unit: 'per piece', availability: 'Limited', origin: 'Malaysia' },
        { _id: '2', fishName: 'Flowerhorn', category: 'Ornamental', unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '3', fishName: 'Oscar Fish', category: 'Tropical', unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '4', fishName: 'Discus Fish', category: 'Tropical', unit: 'per piece', availability: 'Limited', origin: 'Brazil' },
        { _id: '5', fishName: 'Koi Fish', category: 'Coldwater', unit: 'per piece', availability: 'In Stock', origin: 'Japan' },
        { _id: '6', fishName: 'Betta (Fighting)', category: 'Tropical', unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '7', fishName: 'Goldfish (Fancy)', category: 'Coldwater', unit: 'per piece', availability: 'In Stock', origin: 'Local' },
        { _id: '8', fishName: 'Clownfish', category: 'Marine', unit: 'per piece', availability: 'Limited', origin: 'Marine' },
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

  const galleryTotalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const galleryItems = products.slice((galleryPage - 1) * ITEMS_PER_PAGE, galleryPage * ITEMS_PER_PAGE);
  const marketTotalPages = Math.max(1, Math.ceil(livePrices.length / ITEMS_PER_PAGE));
  const marketItems = livePrices.slice((marketPage - 1) * ITEMS_PER_PAGE, marketPage * ITEMS_PER_PAGE);

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <section id="home" className="hero-section">
        <div className="hero-bg-overlay" />
        <div style={{ position: 'absolute', fontSize: '3rem', animation: 'swim 20s linear infinite', top: '30%', zIndex: 0, pointerEvents: 'none' }}>🐠</div>
        <div style={{ position: 'absolute', fontSize: '2rem', animation: 'swim 28s linear infinite 8s', top: '60%', zIndex: 0, pointerEvents: 'none' }}>🐡</div>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center min-vh-100 py-5">
            <div className="col-lg-7">
              <div style={{ color: 'var(--ocean-light)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px', animation: 'fadeInUp 0.8s ease both' }}>🌊 Madurai's Premier Aquatic Hub</div>
              <h1 className="hero-title mb-4"><span className="highlight">MUTHUPANDI</span><br />Fish Farm</h1>
              <p className="hero-subtitle mb-5" style={{ maxWidth: '540px' }}>Premium ornamental & food fish, aquarium equipment, live fish delivery and expert aquaculture services from the heart of Madurai, Tamil Nadu.</p>
              <div className="d-flex flex-wrap gap-3" style={{ animation: 'fadeInUp 1s ease 0.6s both' }}>
                <a href="#gallery" className="btn-ocean btn"><i className="bi bi-collection me-2" />Explore Fish Gallery</a>
                <a href="#prices" className="btn-gold btn"><i className="bi bi-graph-up me-2" />Live Fish Market</a>
              </div>
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
              <div style={{ width: 380, height: 380, background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.05) 60%, transparent 100%)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12rem', animation: 'pulse-glow 3s ease infinite' }}>🐟</div>
            </div>
          </div>
        </div>
        <div className="wave-container"><div className="wave" /></div>
      </section>

      <AnimSection id="about" className="py-5">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <div className="glass-card p-4 text-center" style={{ borderRadius: 24 }}>
                <div style={{ fontSize: '6rem', marginBottom: '16px', animation: 'float 4s ease infinite' }}>🏪</div>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ocean-glow)', fontSize: '1.1rem' }}>Sri Pandia Chinnaiya</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Established • Trusted • Premium</p>
                {[
                  { icon: 'bi-geo-alt-fill', color: 'var(--ocean-light)', text: '6/201 ITI Colony, Aathikulam, K.Pudur - Madurai 7, Tamilnadu' },
                  { icon: 'bi-telephone-fill', color: 'var(--green-sea)', text: '9842186330  |  9842886330' },
                  { icon: 'bi-award-fill', color: 'var(--gold)', text: 'GSTIN: 33ARIPM4129M1ZK' },
                ].map((r, i) => (
                  <div key={i} style={{ background: 'var(--glass)', borderRadius: 12, padding: '16px', marginBottom: '12px' }}>
                    <i className={`bi ${r.icon} me-2`} style={{ color: r.color }} /><span style={{ fontSize: '0.85rem', color: 'var(--ocean-foam)' }}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-7">
              <div style={{ color: 'var(--ocean-light)', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Our Story</div>
              <h2 className="section-title">About Muthupandi Fish Farm</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8 }}>Located in the heart of Madurai, Muthupandi Fish Farm has been a trusted name in aquatic life for over 15 years. We specialize in premium ornamental fish, aquarium equipment, and professional fish farming consultancy.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, marginTop: '16px' }}>From rare Arowanas and vibrant Flowerhorns to everyday Goldfish and Guppies — our farm offers an unmatched variety of healthy, disease-free fish. Every fish is bred and nurtured with care under optimal conditions.</p>
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

      {/* FISH GALLERY - No prices shown */}
      <AnimSection id="gallery" className="py-5" style={{ background: 'linear-gradient(180deg, var(--ocean-deep) 0%, rgba(4,31,59,0.5) 100%)' }}>
        <div className="container py-5">
          <div className="text-center mb-5">
            <div style={{ color: 'var(--ocean-light)', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Our Collection</div>
            <h2 className="section-title">Premium Fish Gallery</h2>
            <p className="section-subtitle">Carefully curated aquatic species for every enthusiast</p>
          </div>
          {productsLoading ? (
            <div className="text-center py-5"><div className="spinner-border text-light" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
              <i className="bi bi-fish" style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }} />
              <p>No products available yet. Check back soon!</p>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {galleryItems.map((fish, i) => (
                  <div key={fish._id || i} className="col-sm-6 col-lg-3">
                    <div className="fish-card h-100">
                      {fish.image ? (
                        <img src={fish.image} alt={fish.name} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 12 }} />
                      ) : (
                        <div className="fish-emoji">🐟</div>
                      )}
                      <div className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 style={{ fontWeight: 700 }}>{fish.name}</h6>
                          <span style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--ocean-glow)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20 }}>{fish.category || 'Fish'}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fish.description || 'Premium quality fish available.'}</p>
                        {fish.unit && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}><i className="bi bi-box-seam me-1" />{fish.unit}</div>}
                        <div style={{ marginTop: 8 }}>
                          <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: (fish.stock > 0) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: (fish.stock > 0) ? '#4ade80' : '#f87171', border: `1px solid ${(fish.stock > 0) ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                            {fish.stock > 0 ? `In Stock` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={galleryPage} totalPages={galleryTotalPages} onPageChange={p => { setGalleryPage(p); document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' }); }} />
            </>
          )}
        </div>
      </AnimSection>

      {/* FISH MARKET - No prices shown */}
      <AnimSection id="prices" className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <div style={{ color: 'var(--gold)', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
              <span style={{ animation: 'pulse-glow 1.5s ease infinite', display: 'inline-block', width: 8, height: 8, background: '#4ade80', borderRadius: '50%', marginRight: 8 }} />Updated Today
            </div>
            <h2 className="section-title">Live Fish Market</h2>
            <p className="section-subtitle">Premium aquatic species available at Muthupandi Fish Farm, Madurai</p>
          </div>
          {pricesLoading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--ocean-light)', width: '3rem', height: '3rem' }} /><p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading market data...</p></div>
          ) : (
            <>
              <div className="row g-3">
                {marketItems.map((p, i) => (
                  <div key={p._id || i} className="col-sm-6 col-md-4 col-lg-3">
                    <div className="glass-card p-3 h-100">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{p.fishName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.category} • {p.origin}</div>
                        </div>
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: `${availabilityColor(p.availability)}22`, color: availabilityColor(p.availability), border: `1px solid ${availabilityColor(p.availability)}44`, whiteSpace: 'nowrap' }}>{p.availability}</span>
                      </div>
                      <div className="mt-3">
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><i className="bi bi-tag me-1" />{p.unit}</div>
                        <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--ocean-light)' }}><i className="bi bi-telephone me-1" />Call for price</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={marketPage} totalPages={marketTotalPages} onPageChange={p => { setMarketPage(p); document.getElementById('prices')?.scrollIntoView({ behavior: 'smooth' }); }} />
            </>
          )}
          <div className="text-center mt-4">
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}><i className="bi bi-info-circle me-1" />Contact us at 9842186330 for current pricing, bulk orders and special rates.</small>
          </div>
        </div>
      </AnimSection>

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
                <div className="glass-card p-4 h-100 text-center">
                  <div style={{ fontSize: '3rem', marginBottom: '16px', animation: `float ${3 + i * 0.3}s ease infinite` }}>{s.icon}</div>
                  <h5 style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, color: 'var(--ocean-foam)', marginBottom: '12px' }}>{s.title}</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimSection>

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
                {contactSent && <div className="alert" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#4ade80', borderRadius: 12 }}><i className="bi bi-check-circle me-2" />Message sent! We'll get back to you shortly.</div>}
                <form onSubmit={handleContactSubmit}>
                  <div className="mb-3"><label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Your Name</label><input className="form-control input-ocean" placeholder="Enter your name" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="mb-3"><label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone Number</label><input className="form-control input-ocean" placeholder="+91 XXXXX XXXXX" type="tel" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div className="mb-4"><label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Message</label><textarea className="form-control input-ocean" rows="4" placeholder="Tell us what you need..." required value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} /></div>
                  <button type="submit" className="btn-ocean btn w-100"><i className="bi bi-send me-2" />Send Message</button>
                </form>
              </div>
            </div>
            <div className="col-lg-4">
              {[
                { icon: 'bi-geo-alt-fill', color: 'rgba(6,182,212,0.15)', iconColor: 'var(--ocean-light)', title: 'Address', body: <>6/201 ITI Colony, Aathikulam,<br />K.Pudur - Madurai 7, Tamilnadu</> },
                { icon: 'bi-telephone-fill', color: 'rgba(16,185,129,0.15)', iconColor: 'var(--green-sea)', title: 'Phone', body: <>9842186330<br />9842886330</> },
                { icon: 'bi-clock-fill', color: 'rgba(245,158,11,0.15)', iconColor: 'var(--gold)', title: 'Working Hours', body: <>Mon–Sat: 8:00 AM – 8:00 PM<br />Sunday: 9:00 AM – 5:00 PM</> },
              ].map((c, i) => (
                <div key={i} className="glass-card p-4 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width: 48, height: 48, background: c.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className={`bi ${c.icon}`} style={{ color: c.iconColor, fontSize: '1.2rem' }} /></div>
                    <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.title}</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{c.body}</div></div>
                  </div>
                </div>
              ))}
              <div className="glass-card p-4">
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px' }}>Follow Us</div>
                <div className="d-flex gap-2">
                  {['facebook', 'instagram', 'youtube', 'whatsapp'].map(s => (
                    <a key={s} href="#" style={{ width: 40, height: 40, background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ocean-light)', textDecoration: 'none' }}><i className={`bi bi-${s}`} /></a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimSection>

      <footer style={{ background: 'var(--ocean-mid)', borderTop: '1px solid var(--glass-border)', padding: '32px 0' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <div className="navbar-brand-text" style={{ fontSize: '1.1rem' }}>🐟 MUTHUPANDI FISH FARM</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>6/201 ITI Colony, Aathikulam, K.Pudur - Madurai 7, Tamilnadu</div>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>GSTIN: 33ARIPM4129M1ZK | State Code: 33</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>© 2024 Muthupandi Fish Farm. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default HomePage;
