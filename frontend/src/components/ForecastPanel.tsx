import React from 'react';
import type { ForecastDay } from '../types/weather';
import WeatherIcon from './WeatherIcon';
import { t } from '../i18n';

interface ForecastPanelProps {
  forecast: ForecastDay[];
  locale: string;
}

const ForecastPanel: React.FC<ForecastPanelProps> = ({ forecast, locale }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        overflowX: 'auto',
      }}
    >
      {forecast.slice(0, 7).map((day, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            minWidth: '64px',
            padding: '10px 8px',
            borderRadius: '14px',
            background: i === 0 ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: i === 0 ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
            transition: 'background 0.2s',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: i === 0 ? '#fff' : 'rgba(255,255,255,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {i === 0 ? t(locale, 'today') : day.day}
          </span>

          <WeatherIcon conditionCode={day.conditionCode} size={32} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {day.tempHigh}°
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              {day.tempLow}°
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ForecastPanel;
