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
  accuracy: string;
  lastUpdated: string;
}
