// src/components/PriceTicker.jsx - Scrolling live price ticker
import React, { useEffect, useState } from 'react';
import { fishPriceAPI } from '../services/api';

const PriceTicker = () => {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    fishPriceAPI.getAll()
      .then(res => setPrices(res.data.data || []))
      .catch(() => {
        // Fallback static prices if backend not running
        setPrices([
          { fishName: 'Arowana', currentPrice: 5000, priceChange: 2.5 },
          { fishName: 'Flowerhorn', currentPrice: 1200, priceChange: -1.2 },
          { fishName: 'Discus', currentPrice: 800, priceChange: 5.0 },
          { fishName: 'Koi', currentPrice: 500, priceChange: 0 },
          { fishName: 'Betta', currentPrice: 100, priceChange: 3.1 },
          { fishName: 'Oscar', currentPrice: 150, priceChange: -2.0 },
          { fishName: 'Goldfish', currentPrice: 80, priceChange: 0.5 },
          { fishName: 'Guppy', currentPrice: 40, priceChange: 1.0 },
          { fishName: 'Angelfish', currentPrice: 120, priceChange: -0.8 },
          { fishName: 'Clownfish', currentPrice: 350, priceChange: 4.2 },
        ]);
      });
  }, []);

  const tickerItems = [...prices, ...prices]; // duplicate for seamless loop

  return (
    <div className="price-ticker-bar">
      <div className="ticker-content">
        {tickerItems.map((p, i) => (
          <span key={i} className="me-5">
            <span style={{ color: 'var(--ocean-foam)', fontWeight: 600 }}>🐠 {p.fishName}</span>
            <span className="ms-2" style={{ color: 'var(--gold-light)' }}>₹{p.currentPrice}</span>
            {p.priceChange !== 0 && (
              <span className={`ms-1 ${p.priceChange > 0 ? 'price-up' : 'price-down'}`}>
                {p.priceChange > 0 ? '▲' : '▼'} {Math.abs(p.priceChange)}%
              </span>
            )}
            <span className="ms-4" style={{ color: 'var(--glass-border)' }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default PriceTicker;
