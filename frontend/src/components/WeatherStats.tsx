import React from 'react';

interface StatItem {
  label: string;
  value: string;
  icon: string;
}

interface WeatherStatsProps {
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  pressure: number;
  feelsLike: number;
}

const WeatherStats: React.FC<WeatherStatsProps> = ({
  humidity,
  windSpeed,
  windDirection,
  visibility,
  pressure,
  feelsLike,
}) => {
  const stats: StatItem[] = [
    { label: 'Hissedilen', value: `${feelsLike}°C`, icon: '🌡️' },
    { label: 'Nem', value: `${humidity}%`, icon: '💧' },
    { label: 'Rüzgar', value: `${windSpeed} km/h ${windDirection}`, icon: '💨' },
    { label: 'Görüş', value: `${visibility} km`, icon: '👁️' },
    { label: 'Basınç', value: `${pressure} hPa`, icon: '⏱️' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'center',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '12px 18px',
            minWidth: '100px',
          }}
        >
          <span style={{ fontSize: '20px' }}>{stat.icon}</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            {stat.value}
          </span>
          <span
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default WeatherStats;
