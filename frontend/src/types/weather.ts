export interface ForecastDay {
  day: string;
  conditionCode: string;
  tempHigh: number;
  tempLow: number;
}

export interface WeatherResponse {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  pressure: number;
  uvIndex: number;
  forecast: ForecastDay[];
  sources: string[];
  provider?: string;
  accuracy: string;
  freshness?: 'fresh' | 'stale';
  lastUpdated: string;
  location: LocationInfo;
}

export interface LocationInfo {
  city: string;
  country: string;
  countryCode: string;
  displayName: string;
  sourceMode: 'gps' | 'manual' | 'city';
}

export interface CitySuggestion {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  displayName: string;
}
