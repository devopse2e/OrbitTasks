// src/components/SideBanner.jsx
import React, { useState, useEffect } from 'react';

const tips = [
  "Organize chaos into clarity.",
  "Achieve more with effortless flow.",
  "Your tasks, orbiting perfectly."
];

const SideBannerLeft = ({ displayName }) => {
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3400);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="side-banner left-banner">
      <div className="banner-content">
        <span className="kinetic-welcome">
          <span className="wave-emoji" role="img" aria-label="wave">👋</span>
          Welcome, <span className="kinetic-name">{displayName || 'User'}</span>
        </span>
        <div className="tips-section">
          {tips.map((tip, idx) => (
            <span
              key={idx}
              className={`kinetic-tip${idx === tipIndex ? ' active' : ''}`}
              style={{
                display: idx === tipIndex ? 'block' : 'none'
              }}
            >
              {tip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SideBannerLeft;
