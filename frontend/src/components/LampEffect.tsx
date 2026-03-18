import React from 'react';

interface LampEffectProps {
  isNight: boolean;
}

const LampEffect: React.FC<LampEffectProps> = ({ isNight }) => {
  if (!isNight) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'hidden',
      }}
    >
      {/* Ornate vintage street lamp SVG at top-right */}
      <svg
        style={{ position: 'absolute', top: -10, right: 60, opacity: 0.92 }}
        width="90"
        height="260"
        viewBox="0 0 90 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Lamp glow halo */}
        <ellipse cx="45" cy="55" rx="34" ry="34" fill="url(#lampHalo)" />
        {/* Lamp shade */}
        <path d="M18 50 Q45 20 72 50 L65 70 H25 Z" fill="#c9a227" stroke="#a07800" strokeWidth="1.5"/>
        {/* Lamp glass */}
        <rect x="30" y="70" width="30" height="22" rx="4" fill="#fffbe6" opacity="0.95"/>
        {/* Ornate top finial */}
        <polygon points="45,12 41,22 49,22" fill="#a07800"/>
        <circle cx="45" cy="10" r="5" fill="#c9a227" stroke="#a07800" strokeWidth="1"/>
        {/* Post */}
        <rect x="42" y="92" width="6" height="140" rx="3" fill="#8a7350"/>
        {/* Bracket arm */}
        <path d="M45 92 Q30 110 30 130" stroke="#8a7350" strokeWidth="4" strokeLinecap="round" fill="none"/>
        {/* Base curl */}
        <ellipse cx="45" cy="232" rx="22" ry="8" fill="#8a7350" opacity="0.7"/>
        <rect x="38" y="224" width="14" height="12" rx="4" fill="#7a6340"/>
        {/* Lamp glow fill */}
        <rect x="31" y="71" width="28" height="20" rx="3" fill="url(#lampInner)" opacity="0.9"/>
        <defs>
          <radialGradient id="lampHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe066" stopOpacity="0.55"/>
            <stop offset="100%" stopColor="#ffe066" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="lampInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffacd"/>
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0.6"/>
          </linearGradient>
        </defs>
      </svg>

      {/* Warm cone of light cast downward from lamp */}
      <div
        style={{
          position: 'absolute',
          top: 88,
          right: 60,
          width: 0,
          height: 0,
          borderLeft: '160px solid transparent',
          borderRight: '160px solid transparent',
          borderTop: '0px solid transparent',
          borderBottom: '500px solid transparent',
          background: 'transparent',
        }}
      />
      <svg
        style={{ position: 'absolute', top: 88, right: -120, pointerEvents: 'none' }}
        width="380"
        height="500"
        viewBox="0 0 380 500"
      >
        <defs>
          <radialGradient id="coneGrad" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.22"/>
            <stop offset="60%" stopColor="#ffaa00" stopOpacity="0.08"/>
            <stop offset="100%" stopColor="#ff8800" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <polygon points="190,0 0,500 380,500" fill="url(#coneGrad)"/>
      </svg>

      {/* Soft warm pool of light on the "ground" */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '55%',
          height: '30%',
          background:
            'radial-gradient(ellipse 60% 50% at 70% 100%, rgba(255, 200, 50, 0.13) 0%, transparent 80%)',
          filter: 'blur(8px)',
        }}
      />
    </div>
  );
};

export default LampEffect;
