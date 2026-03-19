// Standardized weather response interface
export interface WeatherResponse {
  temperature: number;        // Celsius
  feelsLike: number;          // Celsius
  condition: string;          // e.g. "Hafif Kar Yağışlı"
  conditionCode: string;      // machine-readable: "light_snow", "rain", "clear", etc.
  humidity: number;           // percentage 0-100
  windSpeed: number;          // km/h
  windDirection: string;      // e.g. "NW"
  visibility: number;         // km
  pressure: number;           // hPa
  uvIndex: number;
  forecast: ForecastDay[];
  sources: string[];
  accuracy: string;
  lastUpdated: string;        // ISO timestamp
  location: LocationInfo;
}

export interface LocationInfo {
  city: string;
  country: string;
  countryCode: string;
  displayName: string;
  sourceMode: 'gps' | 'manual' | 'city';
}

export interface ForecastDay {
  day: string;        // Turkish short name: "Pzt", "Sal", etc.
  conditionCode: string;
  tempHigh: number;
  tempLow: number;
}

export interface WeatherQuery {
  city?: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
  locale?: string;
  sourceMode?: 'gps' | 'manual' | 'city';
}

export interface CitySuggestion {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  displayName: string;
}

// Raw source shapes (before normalization)
export interface OpenWeatherRaw {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: { speed: number; deg: number };
  visibility: number;
  weather: Array<{ id: number; description: string; main: string }>;
  uvi?: number;
}

export interface TomorrowIoRaw {
  data: {
    timelines: Array<{
      intervals: Array<{
        values: {
          temperature: number;
          temperatureApparent: number;
          humidity: number;
          windSpeed: number;
          windDirection: number;
          visibility: number;
          pressureSurfaceLevel: number;
          uvIndex: number;
          weatherCode: number;
        };
      }>;
    }>;
  };
}

export interface MetNorwayRaw {
  properties: {
    timeseries: Array<{
      data: {
        instant: {
          details: {
            air_temperature: number;
            relative_humidity: number;
            wind_speed: number;
            wind_from_direction: number;
            air_pressure_at_sea_level: number;
            fog_area_fraction: number;
            ultraviolet_index_clear_sky: number;
          };
        };
        next_1_hours?: {
          summary: { symbol_code: string };
        };
      };
    }>;
  };
}
