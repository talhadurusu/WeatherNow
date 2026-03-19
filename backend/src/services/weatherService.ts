import {
  WeatherResponse,
  ForecastDay,
  WeatherQuery,
} from '../types/weather';

type SupportedLanguage = 'tr' | 'en';

function resolveLanguage(locale?: string): SupportedLanguage {
  const base = (locale ?? 'en').toLowerCase();
  if (base.startsWith('tr')) return 'tr';
  return 'en';
}

function dayName(offset: number, locale: string): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
}

function dayNameFromUnix(unixSeconds: number, timezoneOffsetSeconds: number, locale: string): string {
  const utcMs = unixSeconds * 1000;
  const localMs = utcMs + timezoneOffsetSeconds * 1000;
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(localMs));
}

// --- Wind-degree -> cardinal direction ---------------------------------------
function degToCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// --- Condition-code vocabulary -----------------------------------------------
// Allowed condition codes (machine-readable)
type ConditionCode =
  | 'heavy_snow'
  | 'light_snow'
  | 'heavy_rain'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'fog'
  | 'cloudy'
  | 'partly_cloudy'
  | 'clear';

const CONDITION_LABELS: Record<SupportedLanguage, Record<ConditionCode, string>> = {
  tr: {
    heavy_snow: 'Yogun Kar Yagisli',
    light_snow: 'Hafif Kar Yagisli',
    heavy_rain: 'Siddetli Yagmurlu',
    rain: 'Yagmurlu',
    drizzle: 'Ciseleyen Yagmur',
    thunderstorm: 'Firtinali',
    fog: 'Sisli',
    cloudy: 'Bulutlu',
    partly_cloudy: 'Parcali Bulutlu',
    clear: 'Acik',
  },
  en: {
    heavy_snow: 'Heavy Snow',
    light_snow: 'Light Snow',
    heavy_rain: 'Heavy Rain',
    rain: 'Rain',
    drizzle: 'Drizzle',
    thunderstorm: 'Thunderstorm',
    fog: 'Fog',
    cloudy: 'Cloudy',
    partly_cloudy: 'Partly Cloudy',
    clear: 'Clear',
  },
};

const ACCURACY_LABELS: Record<SupportedLanguage, string> = {
  tr: 'Canli veri',
  en: 'Live weather feed',
};

// --- Normalizers --------------------------------------------------------------
interface NormalizedSource {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;       // km/h
  windDirection: number;   // degrees
  visibility: number;      // km
  pressure: number;
  uvIndex: number;
  conditionCode: ConditionCode;
}

interface ProviderWeather {
  current: NormalizedSource;
  forecast: ForecastDay[];
  provider: string;
  sources: string[];
  timezoneOffsetSeconds: number;
}

interface OpenMeteoResponse {
  utc_offset_seconds: number;
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    visibility: number;
    pressure_msl: number;
    uv_index: number;
    weather_code: number;
  };
  daily: {
    time: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

interface OpenWeatherOneCallResponse {
  timezone_offset: number;
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_deg: number;
    visibility: number;
    uvi: number;
    weather: Array<{ id: number }>;
  };
  daily: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    weather: Array<{ id: number }>;
  }>;
}

function normalizeOpenWeatherCode(code: number): ConditionCode {
  let conditionCode: ConditionCode = 'clear';
  if (code >= 200 && code < 300) conditionCode = 'thunderstorm';
  else if (code >= 300 && code < 400) conditionCode = 'drizzle';
  else if (code >= 500 && code < 502) conditionCode = 'rain';
  else if (code >= 502 && code < 600) conditionCode = 'heavy_rain';
  else if (code === 600 || code === 620) conditionCode = 'light_snow';
  else if (code >= 601 && code < 620) conditionCode = 'heavy_snow';
  else if (code >= 621 && code < 700) conditionCode = 'light_snow';
  else if (code >= 700 && code < 800) conditionCode = 'fog';
  else if (code === 801 || code === 802) conditionCode = 'partly_cloudy';
  else if (code > 802) conditionCode = 'cloudy';
  return conditionCode;
}

function normalizeOpenWeatherCurrent(raw: OpenWeatherOneCallResponse): NormalizedSource {
  const weatherCode = raw.current.weather[0]?.id ?? 800;

  return {
    temperature: raw.current.temp,
    feelsLike: raw.current.feels_like,
    humidity: raw.current.humidity,
    windSpeed: raw.current.wind_speed * 3.6,    // m/s -> km/h
    windDirection: raw.current.wind_deg,
    visibility: raw.current.visibility / 1000,  // m -> km
    pressure: raw.current.pressure,
    uvIndex: raw.current.uvi,
    conditionCode: normalizeOpenWeatherCode(weatherCode),
  };
}

interface OpenWeatherCurrentResponse {
  timezone: number;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  visibility?: number;
  weather: Array<{ id: number }>;
}

interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{ id: number }>;
  }>;
}

function mapOpenMeteoCode(code: number): ConditionCode {
  let conditionCode: ConditionCode = 'clear';
  if (code >= 95 && code <= 99) conditionCode = 'thunderstorm';
  else if (code >= 80 && code <= 82) conditionCode = 'rain';
  else if (code >= 61 && code <= 67) conditionCode = 'drizzle';
  else if (code >= 71 && code <= 77) conditionCode = 'light_snow';
  else if (code === 85 || code === 86) conditionCode = 'heavy_snow';
  else if (code === 45 || code === 48) conditionCode = 'fog';
  else if (code === 1 || code === 2) conditionCode = 'partly_cloudy';
  else if (code === 3) conditionCode = 'cloudy';
  return conditionCode;
}

function normalizeOpenMeteoCurrent(raw: OpenMeteoResponse): NormalizedSource {
  return {
    temperature: raw.current.temperature_2m,
    feelsLike: raw.current.apparent_temperature,
    humidity: raw.current.relative_humidity_2m,
    windSpeed: raw.current.wind_speed_10m,
    windDirection: raw.current.wind_direction_10m,
    visibility: raw.current.visibility / 1000,
    pressure: raw.current.pressure_msl,
    uvIndex: raw.current.uv_index,
    conditionCode: mapOpenMeteoCode(raw.current.weather_code),
  };
}

// --- Aggregation --------------------------------------------------------------
function buildEmptyForecast(baseCondition: ConditionCode, currentTemp: number, locale: string): ForecastDay[] {
  return Array.from({ length: 7 }).map((_, i) => ({
    day: dayName(i, locale),
    conditionCode: baseCondition,
    tempHigh: Math.round(currentTemp + 1),
    tempLow: Math.round(currentTemp - 3),
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

async function fetchJson<T>(url: string, timeoutMs = 7000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Weather provider returned ${res.status}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function buildOpenWeatherForecast(raw: OpenWeatherOneCallResponse, locale: string): ForecastDay[] {
  return raw.daily.slice(0, 7).map((d) => ({
    day: dayNameFromUnix(d.dt, raw.timezone_offset, locale),
    conditionCode: normalizeOpenWeatherCode(d.weather[0]?.id ?? 800),
    tempHigh: Math.round(d.temp.max),
    tempLow: Math.round(d.temp.min),
  }));
}

function normalizeOpenWeatherCurrentFromCurrentApi(raw: OpenWeatherCurrentResponse): NormalizedSource {
  const weatherCode = raw.weather[0]?.id ?? 800;

  return {
    temperature: raw.main.temp,
    feelsLike: raw.main.feels_like,
    humidity: raw.main.humidity,
    windSpeed: raw.wind.speed * 3.6,
    windDirection: raw.wind.deg,
    visibility: (raw.visibility ?? 10000) / 1000,
    pressure: raw.main.pressure,
    uvIndex: 0,
    conditionCode: normalizeOpenWeatherCode(weatherCode),
  };
}

function buildOpenWeatherForecastFrom3h(
  raw: OpenWeatherForecastResponse,
  timezoneOffsetSeconds: number,
  locale: string,
): ForecastDay[] {
  const grouped = new Map<string, { min: number; max: number; codes: number[]; dt: number }>();

  for (const point of raw.list) {
    const localMs = (point.dt + timezoneOffsetSeconds) * 1000;
    const dayKey = new Date(localMs).toISOString().slice(0, 10);
    const existing = grouped.get(dayKey);

    if (!existing) {
      grouped.set(dayKey, {
        min: point.main.temp_min,
        max: point.main.temp_max,
        codes: [point.weather[0]?.id ?? 800],
        dt: point.dt,
      });
      continue;
    }

    existing.min = Math.min(existing.min, point.main.temp_min);
    existing.max = Math.max(existing.max, point.main.temp_max);
    existing.codes.push(point.weather[0]?.id ?? 800);
  }

  const sortedDays = Array.from(grouped.values())
    .sort((a, b) => a.dt - b.dt)
    .slice(0, 7);

  return sortedDays.map((day) => {
    const representativeCode = day.codes[Math.floor(day.codes.length / 2)] ?? 800;

    return {
      day: dayNameFromUnix(day.dt, timezoneOffsetSeconds, locale),
      conditionCode: normalizeOpenWeatherCode(representativeCode),
      tempHigh: Math.round(day.max),
      tempLow: Math.round(day.min),
    };
  });
}

function getOpenWeatherOneCallUrl(apiVersion: '3.0' | '2.5', lat: number, lon: number, apiKey: string): string {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: apiKey,
    units: 'metric',
  });

  return `https://api.openweathermap.org/data/${apiVersion}/onecall?${params.toString()}`;
}

function getOpenWeatherCurrentUrl(lat: number, lon: number, apiKey: string): string {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: apiKey,
    units: 'metric',
  });

  return `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`;
}

function getOpenWeatherForecastUrl(lat: number, lon: number, apiKey: string): string {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: apiKey,
    units: 'metric',
  });

  return `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`;
}

async function fetchOpenWeather(lat: number, lon: number, locale: string): Promise<ProviderWeather> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeather provider is unavailable: OPENWEATHER_API_KEY is missing.');
  }

  try {
    const oneCallUrl30 = getOpenWeatherOneCallUrl('3.0', lat, lon, apiKey);
    const raw30 = await fetchJson<OpenWeatherOneCallResponse>(oneCallUrl30);

    return {
      current: normalizeOpenWeatherCurrent(raw30),
      forecast: buildOpenWeatherForecast(raw30, locale),
      provider: 'OpenWeather',
      sources: ['OpenWeather One Call 3.0'],
      timezoneOffsetSeconds: raw30.timezone_offset,
    };
  } catch {
    try {
      const oneCallUrl25 = getOpenWeatherOneCallUrl('2.5', lat, lon, apiKey);
      const raw25 = await fetchJson<OpenWeatherOneCallResponse>(oneCallUrl25);

      return {
        current: normalizeOpenWeatherCurrent(raw25),
        forecast: buildOpenWeatherForecast(raw25, locale),
        provider: 'OpenWeather',
        sources: ['OpenWeather One Call 2.5'],
        timezoneOffsetSeconds: raw25.timezone_offset,
      };
    } catch {
      const currentUrl = getOpenWeatherCurrentUrl(lat, lon, apiKey);
      const forecastUrl = getOpenWeatherForecastUrl(lat, lon, apiKey);
      const [currentRaw, forecastRaw] = await Promise.all([
        fetchJson<OpenWeatherCurrentResponse>(currentUrl),
        fetchJson<OpenWeatherForecastResponse>(forecastUrl),
      ]);

      return {
        current: normalizeOpenWeatherCurrentFromCurrentApi(currentRaw),
        forecast: buildOpenWeatherForecastFrom3h(forecastRaw, currentRaw.timezone, locale),
        provider: 'OpenWeather',
        sources: ['OpenWeather Current', 'OpenWeather 5 Day / 3 Hour'],
        timezoneOffsetSeconds: currentRaw.timezone,
      };
    }
  }
}

function buildOpenMeteoForecast(raw: OpenMeteoResponse, locale: string): ForecastDay[] {
  const len = Math.min(
    7,
    raw.daily.time.length,
    raw.daily.weather_code.length,
    raw.daily.temperature_2m_max.length,
    raw.daily.temperature_2m_min.length,
  );

  const forecast: ForecastDay[] = [];
  for (let i = 0; i < len; i += 1) {
    forecast.push({
      day: dayNameFromUnix(raw.daily.time[i], raw.utc_offset_seconds, locale),
      conditionCode: mapOpenMeteoCode(raw.daily.weather_code[i]),
      tempHigh: Math.round(raw.daily.temperature_2m_max[i]),
      tempLow: Math.round(raw.daily.temperature_2m_min[i]),
    });
  }

  return forecast;
}

async function fetchOpenMeteo(lat: number, lon: number, locale: string): Promise<ProviderWeather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,visibility,pressure_msl,uv_index,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '7',
    timezone: 'auto',
    timeformat: 'unixtime',
  });

  const raw = await fetchJson<OpenMeteoResponse>(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  return {
    current: normalizeOpenMeteoCurrent(raw),
    forecast: buildOpenMeteoForecast(raw, locale),
    provider: 'Open-Meteo',
    sources: ['Open-Meteo'],
    timezoneOffsetSeconds: raw.utc_offset_seconds,
  };
}

// --- Main aggregation function ------------------------------------------------
export async function aggregateWeather(query: WeatherQuery = {}): Promise<WeatherResponse> {
  const locale = query.locale ?? 'en';
  const lang = resolveLanguage(locale);

  if (typeof query.lat !== 'number' || typeof query.lon !== 'number') {
    throw new Error('Weather lookup requires coordinates.');
  }

  let providerWeather: ProviderWeather;
  try {
    providerWeather = await fetchOpenWeather(query.lat, query.lon, locale);
  } catch {
    providerWeather = await fetchOpenMeteo(query.lat, query.lon, locale);
  }

  const current = providerWeather.current;
  const forecast = providerWeather.forecast.length > 0
    ? providerWeather.forecast
    : buildEmptyForecast(current.conditionCode, current.temperature, locale);

  const temperature = roundOne(current.temperature);
  const feelsLike = roundOne(current.feelsLike);
  const humidity = clamp(Math.round(current.humidity), 0, 100);
  const windSpeed = roundOne(clamp(current.windSpeed, 0, 180));
  const visibility = roundOne(clamp(current.visibility, 0.1, 100));
  const pressure = Math.round(clamp(current.pressure, 850, 1100));
  const uvIndex = roundOne(clamp(current.uvIndex, 0, 14));

  const response: WeatherResponse = {
    temperature,
    feelsLike,
    condition: CONDITION_LABELS[lang][current.conditionCode],
    conditionCode: current.conditionCode,
    humidity,
    windSpeed,
    windDirection: degToCardinal(current.windDirection),
    visibility,
    pressure,
    uvIndex,
    forecast,
    sources: providerWeather.sources,
    provider: providerWeather.provider,
    accuracy: `${ACCURACY_LABELS[lang]} (${providerWeather.provider})`,
    freshness: 'fresh',
    lastUpdated: new Date().toISOString(),
    location: {
      city: query.city ?? 'Unknown',
      country: query.country ?? 'Unknown',
      countryCode: query.countryCode ?? '',
      displayName: query.countryCode
        ? `${query.city ?? 'Unknown'}, ${query.countryCode}`
        : (query.country ? `${query.city ?? 'Unknown'}, ${query.country}` : (query.city ?? 'Unknown')),
      sourceMode: query.sourceMode ?? (query.city ? 'city' : 'gps'),
    },
  };

  return response;
}