import React, { useMemo } from 'react';
import type { WeatherResponse } from '../types/weather';
import WeatherIcon from './WeatherIcon';
import ForecastPanel from './ForecastPanel';
import WeatherStats from './WeatherStats';
import ParticleEffect from './ParticleEffect';

interface WeatherCardProps {
  data: WeatherResponse;
}

type ParticleType = 'snow' | 'rain' | 'none';

function seededValue(seed: number): number {
  const value = Math.sin(seed * 9999.91) * 10000;
  return value - Math.floor(value);
}

function getBackgroundGradient(conditionCode: string, isNight: boolean): string {
  if (isNight) {
    switch (conditionCode) {
      case 'heavy_snow':
      case 'light_snow':
        return 'linear-gradient(160deg, #0d1b2a 0%, #1a2a3a 40%, #0f1c2b 70%, #162030 100%)';
      case 'heavy_rain':
      case 'rain':
      case 'drizzle':
        return 'linear-gradient(160deg, #0a0f1a 0%, #111827 40%, #0d1520 70%, #111825 100%)';
      case 'thunderstorm':
        return 'linear-gradient(160deg, #0a0a15 0%, #151525 50%, #0d0d1e 100%)';
      case 'fog':
        return 'linear-gradient(160deg, #1a1a25 0%, #252535 50%, #1e1e2e 100%)';
      case 'clear':
        return 'linear-gradient(160deg, #0a1628 0%, #0d1f35 40%, #0c1a30 70%, #091525 100%)';
      default:
        return 'linear-gradient(160deg, #0f1923 0%, #1a2535 40%, #141e2a 100%)';
    }
  }

  // Daytime
  switch (conditionCode) {
    case 'heavy_snow':
      return 'linear-gradient(160deg, #4a6785 0%, #7298b5 40%, #8fafc8 70%, #6589a4 100%)';
    case 'light_snow':
      return 'linear-gradient(160deg, #5a7a9a 0%, #82a5c0 40%, #9bbdd4 70%, #7398b5 100%)';
    case 'heavy_rain':
      return 'linear-gradient(160deg, #2c3e55 0%, #3d5169 40%, #2e4060 70%, #253550 100%)';
    case 'rain':
      return 'linear-gradient(160deg, #3a5068 0%, #4d6a80 40%, #3f5f78 70%, #334f68 100%)';
    case 'drizzle':
      return 'linear-gradient(160deg, #4a6878 0%, #608090 40%, #567082 70%, #486070 100%)';
    case 'thunderstorm':
      return 'linear-gradient(160deg, #1e2a38 0%, #2a3848 50%, #1c2835 100%)';
    case 'fog':
      return 'linear-gradient(160deg, #8a9aa8 0%, #a0b0be 50%, #909fa8 100%)';
    case 'cloudy':
      return 'linear-gradient(160deg, #6a7e92 0%, #8090a0 40%, #7a8e9e 100%)';
    case 'partly_cloudy':
      return 'linear-gradient(160deg, #3a6fa5 0%, #6295c5 40%, #4880b5 70%, #3570a0 100%)';
    case 'clear':
      return 'linear-gradient(160deg, #1a6fa5 0%, #2d8ac0 40%, #3a9dd0 70%, #1e7db0 100%)';
    default:
      return 'linear-gradient(160deg, #2a5a80 0%, #3a7098 50%, #2a6080 100%)';
  }
}

function getParticleType(conditionCode: string): ParticleType {
  if (conditionCode === 'heavy_snow' || conditionCode === 'light_snow') return 'snow';
  if (conditionCode === 'heavy_rain' || conditionCode === 'rain' || conditionCode === 'drizzle') return 'rain';
  return 'none';
}

function getTextAccentColor(conditionCode: string, isNight: boolean): string {
  if (isNight) return '#a5c8e8';
  switch (conditionCode) {
    case 'light_snow':
    case 'heavy_snow':
      return '#c5e0f5';
    case 'clear':
      return '#ffe082';
    case 'partly_cloudy':
      return '#e0f0ff';
    default:
      return '#ddeeff';
  }
}

function formatLastUpdated(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 20;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  const isNight = useMemo(() => isNightTime(), []);
  const particleType = useMemo(() => getParticleType(data.conditionCode), [data.conditionCode]);
  const bg = useMemo(() => getBackgroundGradient(data.conditionCode, isNight), [data.conditionCode, isNight]);
  const accentColor = useMemo(() => getTextAccentColor(data.conditionCode, isNight), [data.conditionCode, isNight]);

  const starCount = isNight ? 80 : 0;
  const cloudCount = isNight ? 0 : 5;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 1s ease',
      }}
    >
      {!isNight && (
        <>
          <div
            style={{
              position: 'fixed',
              top: '-90px',
              right: '-90px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 226, 140, 0.42) 0%, rgba(255, 226, 140, 0.08) 50%, rgba(255, 226, 140, 0) 72%)',
              zIndex: 0,
              pointerEvents: 'none',
              animation: 'sunPulse 7s ease-in-out infinite',
            }}
          />

          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {Array.from({ length: cloudCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${8 + i * 11}%`,
                  left: `${(i * 23) % 100}%`,
                  width: `${100 + i * 18}px`,
                  height: `${30 + i * 6}px`,
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.20)',
                  filter: 'blur(1px)',
                  opacity: 0.55,
                  animation: `cloudDrift ${20 + i * 5}s linear ${i * -4}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {isNight && (
        <div
          style={{
            position: 'fixed',
            top: '7%',
            right: '8%',
            width: '170px',
            height: '170px',
            borderRadius: '50%',
            zIndex: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(233, 244, 255, 0.26) 0%, rgba(233, 244, 255, 0.08) 46%, rgba(233, 244, 255, 0) 72%)',
            animation: 'moonGlow 5.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Stars for night mode */}
      {isNight && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: starCount }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${seededValue(i + 1) * 100}%`,
                top: `${seededValue(i + 31) * 60}%`,
                width: `${seededValue(i + 71) * 2 + 1}px`,
                height: `${seededValue(i + 91) * 2 + 1}px`,
                borderRadius: '50%',
                background: '#fff',
                opacity: seededValue(i + 121) * 0.7 + 0.2,
                animation: `twinkle ${(seededValue(i + 151) * 3 + 2).toFixed(1)}s ease-in-out ${(seededValue(i + 181) * 2).toFixed(1)}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated particles (snow/rain) */}
      <ParticleEffect type={particleType} count={particleType === 'snow' ? 105 : 70} />

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '560px',
          width: '100%',
          padding: '8px 4px 16px',
        }}
      >
        {/* Location / App title */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            WeatherNow
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em',
            }}
          >
            {isNight ? '🌙 Gece' : '☀️ Gündüz'} &nbsp;·&nbsp; Canlı Hava Durumu
          </p>
        </div>

        {/* Big weather icon */}
        <div
          style={{
            filter: 'drop-shadow(0 0 24px rgba(255,255,255,0.2))',
            animation: 'float 4s ease-in-out infinite',
          }}
        >
          <WeatherIcon conditionCode={data.conditionCode} size={96} />
        </div>

        {/* Temperature + Condition */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 'clamp(58px, 13vw, 106px)',
              fontWeight: 800,
              lineHeight: 1,
              color: '#ffffff',
              textShadow: `0 0 40px ${accentColor}80, 0 4px 20px rgba(0,0,0,0.4)`,
              letterSpacing: '-0.02em',
            }}
          >
            {data.temperature > 0 ? '+' : ''}{data.temperature}°C
          </div>

          <div
            style={{
              marginTop: '12px',
              fontSize: '22px',
              fontWeight: 600,
              color: accentColor,
              textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              letterSpacing: '0.02em',
            }}
          >
            {data.condition}
          </div>

          {/* Source accuracy badge */}
          <div
            style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              borderRadius: '20px',
              padding: '5px 14px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>●</span>
            <span
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 500,
                letterSpacing: '0.03em',
              }}
            >
              {data.accuracy}
            </span>
          </div>
        </div>

        {/* Weather stats */}
        <WeatherStats
          humidity={data.humidity}
          windSpeed={data.windSpeed}
          windDirection={data.windDirection}
          visibility={data.visibility}
          pressure={data.pressure}
          feelsLike={data.feelsLike}
        />

        {/* 7-day forecast */}
        <div style={{ width: '100%' }}>
          <p
            style={{
              margin: '0 0 8px 4px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            7 Günlük Tahmin
          </p>
          <ForecastPanel forecast={data.forecast} />
        </div>

        {/* Source info + last updated */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {data.sources.map((src) => (
              <span
                key={src}
                style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {src}
              </span>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
            Son güncelleme: {formatLastUpdated(data.lastUpdated)}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes sunPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes moonGlow {
          0%, 100% { transform: scale(1); opacity: 0.72; }
          50% { transform: scale(1.05); opacity: 0.92; }
        }
        @keyframes cloudDrift {
          0% { transform: translateX(-22vw); }
          100% { transform: translateX(132vw); }
        }
        @keyframes twinkle {
          0% { opacity: 0.2; }
          100% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

export default WeatherCard;
