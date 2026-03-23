import React, { useMemo } from 'react';

const BubblesBg = () => {
  const bubbles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      size: Math.random() * 40 + 8,
      left: Math.random() * 100,
      duration: Math.random() * 10 + 12, // ⬅️ slower (12–22s)
      opacity: Math.random() * 0.3 + 0.1
    })),
  []);

  return (
    <div className="bubbles-container">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            animationDuration: `${b.duration}s`,
            opacity: b.opacity
          }}
        />
      ))}
    </div>
  );
};

export default BubblesBg;