import React from 'react';

interface WeatherIconProps {
  conditionCode: string;
  size?: number;
  className?: string;
}

const CONDITION_LABELS: Record<string, string> = {
  heavy_snow: 'Heavy snow icon',
  light_snow: 'Light snow icon',
  heavy_rain: 'Heavy rain icon',
  rain: 'Rain icon',
  drizzle: 'Drizzle icon',
  thunderstorm: 'Thunderstorm icon',
  fog: 'Fog icon',
  cloudy: 'Cloudy icon',
  partly_cloudy: 'Partly cloudy icon',
  clear: 'Clear sky icon',
};

const WeatherIcon: React.FC<WeatherIconProps> = ({ conditionCode, size = 40, className = '' }) => {
  const s = size;
  const ariaLabel = CONDITION_LABELS[conditionCode] ?? 'Weather icon';

  const icon = (() => {
    switch (conditionCode) {
      case 'heavy_snow':
      case 'light_snow':
        return (
          <svg aria-hidden="true" width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="32" y1="4" x2="32" y2="60" stroke="#a5d8ff" strokeWidth="4" strokeLinecap="round"/>
            <line x1="4" y1="32" x2="60" y2="32" stroke="#a5d8ff" strokeWidth="4" strokeLinecap="round"/>
            <line x1="9.37" y1="9.37" x2="54.63" y2="54.63" stroke="#a5d8ff" strokeWidth="4" strokeLinecap="round"/>
            <line x1="54.63" y1="9.37" x2="9.37" y2="54.63" stroke="#a5d8ff" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="32" cy="32" r="4" fill="#ffffff"/>
            <circle cx="32" cy="4" r="3" fill="#c5e8ff"/>
            <circle cx="32" cy="60" r="3" fill="#c5e8ff"/>
            <circle cx="4" cy="32" r="3" fill="#c5e8ff"/>
            <circle cx="60" cy="32" r="3" fill="#c5e8ff"/>
            <circle cx="9.37" cy="9.37" r="3" fill="#c5e8ff"/>
            <circle cx="54.63" cy="54.63" r="3" fill="#c5e8ff"/>
            <circle cx="54.63" cy="9.37" r="3" fill="#c5e8ff"/>
            <circle cx="9.37" cy="54.63" r="3" fill="#c5e8ff"/>
          </svg>
        );

      case 'heavy_rain':
      case 'rain':
        return (
          <svg aria-hidden="true" width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 38a18 18 0 1 1 36 0" stroke="#74b9ff" strokeWidth="3" strokeLinecap="round"/>
            <rect x="10" y="36" width="44" height="14" rx="7" fill="#74b9ff"/>
            <line x1="20" y1="54" x2="16" y2="62" stroke="#0984e3" strokeWidth="3" strokeLinecap="round"/>
            <line x1="32" y1="54" x2="28" y2="62" stroke="#0984e3" strokeWidth="3" strokeLinecap="round"/>
            <line x1="44" y1="54" x2="40" y2="62" stroke="#0984e3" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        );

      case 'drizzle':
        return (
          <svg aria-hidden="true" width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 36a16 16 0 1 1 32 0" stroke="#74b9ff" strokeWidth="3" strokeLinecap="round"/>
            <rect x="12" y="34" width="40" height="12" rx="6" fill="#74b9ff"/>
            <line x1="22" y1="50" x2="20" y2="58" stroke="#0984e3" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="32" y1="50" x2="30" y2="58" stroke="#0984e3" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="42" y1="50" x2="40" y2="58" stroke="#0984e3" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        );

      case 'thunderstorm':
        return (
          <svg aria-hidden="true" width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 34a18 18 0 1 1 36 0" stroke="#636e72" strokeWidth="3" strokeLinecap="round"/>
            <rect x="10" y="32" width="44" height="14" rx="7" fill="#636e72"/>
            <polyline points="36,46 28,56 34,56 26,66" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        );

      case 'fog':
        return (
          <svg aria-hidden="true" width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="8" y1="24" x2="56" y2="24" stroke="#b2bec3" strokeWidth="4" strokeLinecap="round"/>
            <line x1="14" y1="34" x2="50" y2="34" stroke="#b2bec3" strokeWidth="4" strokeLinecap="round"/>
            <line x1="8" y1="44" x2="56" y2="44" stroke="#b2bec3" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        );

      case 'cloudy':
        return (
          <svg aria-hidden="true" width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 42a16 16 0 1 1 32 0" stroke="#b2bec3" strokeWidth="3" strokeLinecap="round"/>
            <rect x="12" y="40" width="40" height="14" rx="7" fill="#b2bec3"/>
          </svg>
        );

      case 'partly_cloudy':
        return (
          <svg aria-hidden="true" width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="22" r="12" fill="#fdcb6e"/>
            <circle cx="20" cy="22" r="8" fill="#ffeaa7"/>
            {/* Sun rays */}
            <line x1="20" y1="4" x2="20" y2="8" stroke="#fdcb6e" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="20" y1="36" x2="20" y2="40" stroke="#fdcb6e" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="4" y1="22" x2="8" y2="22" stroke="#fdcb6e" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="32" y1="22" x2="36" y2="22" stroke="#fdcb6e" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M26 44a14 14 0 1 1 28 0" stroke="#b2bec3" strokeWidth="3" strokeLinecap="round"/>
            <rect x="22" y="42" width="38" height="12" rx="6" fill="#b2bec3"/>
          </svg>
        );

      case 'clear':
      default:
        return (
          <svg aria-hidden="true" width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="14" fill="#fdcb6e"/>
            <circle cx="32" cy="32" r="10" fill="#ffeaa7"/>
            <line x1="32" y1="4" x2="32" y2="12" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round"/>
            <line x1="32" y1="52" x2="32" y2="60" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round"/>
            <line x1="4" y1="32" x2="12" y2="32" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round"/>
            <line x1="52" y1="32" x2="60" y2="32" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round"/>
            <line x1="11.5" y1="11.5" x2="17.2" y2="17.2" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round"/>
            <line x1="46.8" y1="46.8" x2="52.5" y2="52.5" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round"/>
            <line x1="52.5" y1="11.5" x2="46.8" y2="17.2" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round"/>
            <line x1="17.2" y1="46.8" x2="11.5" y2="52.5" stroke="#fdcb6e" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        );
    }
  })();

  return <span className={className} role="img" aria-label={ariaLabel}>{icon}</span>;
};

export default WeatherIcon;
