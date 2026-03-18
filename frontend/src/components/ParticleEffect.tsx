import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  wind: number;
}

interface ParticleEffectProps {
  type: 'snow' | 'rain' | 'none';
  count?: number;
}

const ParticleEffect: React.FC<ParticleEffectProps> = ({ type, count = 120 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (type === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: type === 'snow' ? Math.random() * 4 + 2 : Math.random() * 1.5 + 0.5,
      speed: type === 'snow' ? Math.random() * 1.5 + 0.5 : Math.random() * 8 + 6,
      drift: type === 'snow' ? (Math.random() - 0.5) * 1 : (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.6 + 0.4,
      wind: (Math.random() - 0.5) * 0.3,
    }));

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      particlesRef.current.forEach((p) => {
        // Move particle
        p.y += p.speed;
        p.x += p.drift + Math.sin(frame * 0.02 + p.x * 0.01) * p.wind;

        // Reset when off-screen
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.save();
        ctx.globalAlpha = p.opacity;

        if (type === 'snow') {
          // Draw snowflake
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#c8e6ff';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw raindrop
          ctx.strokeStyle = '#74b9ff';
          ctx.lineWidth = p.size;
          ctx.shadowColor = '#0984e3';
          ctx.shadowBlur = 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.drift * 3, p.y + p.size * 6);
          ctx.stroke();
        }
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [type, count]);

  if (type === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default ParticleEffect;
