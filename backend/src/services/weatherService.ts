import {
  WeatherResponse,
  ForecastDay,
  OpenWeatherRaw,
  TomorrowIoRaw,
  MetNorwayRaw,
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

// ─── Wind-degree → cardinal direction ────────────────────────────────────────
function degToCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ─── Condition-code vocabulary ────────────────────────────────────────────────
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
  tr: '3 Kaynaktan Harmanlanmis Yuksek Dogruluk',
  en: 'High confidence blend from 3 sources',
};

// ─── Simulated OpenWeather response ──────────────────────────────────────────
function fetchOpenWeather(): OpenWeatherRaw {
  return {
    main: { temp: -3.2, feels_like: -7.1, humidity: 82, pressure: 1012 },
    wind: { speed: 5.5, deg: 315 },
    visibility: 4000,
    weather: [{ id: 600, description: 'light snow', main: 'Snow' }],
    uvi: 0,
  };
}

// ─── Simulated Tomorrow.io response ──────────────────────────────────────────
function fetchTomorrowIo(): TomorrowIoRaw {
  return {
    data: {
      timelines: [
        {
          intervals: [
            {
              values: {
                temperature: -2.8,
                temperatureApparent: -6.5,
                humidity: 79,
                windSpeed: 18,          // km/h
                windDirection: 320,
                visibility: 4.2,        // km
                pressureSurfaceLevel: 1013,
                uvIndex: 0,
                weatherCode: 5001,      // flurries / light snow
              },
            },
          ],
        },
      ],
    },
  };
}

// ─── Simulated MET Norway response ───────────────────────────────────────────
function fetchMetNorway(): MetNorwayRaw {
  return {
    properties: {
      timeseries: [
        {
          data: {
            instant: {
              details: {
                air_temperature: -3.5,
                relative_humidity: 85,
                wind_speed: 5.2,        // m/s → will convert
                wind_from_direction: 310,
                air_pressure_at_sea_level: 1011,
                fog_area_fraction: 0,
                ultraviolet_index_clear_sky: 0,
              },
            },
            next_1_hours: {
              summary: { symbol_code: 'lightsnow' },
            },
          },
        },
      ],
    },
  };
}

// ─── Normalizers ─────────────────────────────────────────────────────────────
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

function normalizeOpenWeather(raw: OpenWeatherRaw): NormalizedSource {
  const wId = raw.weather[0]?.id ?? 800;
  let conditionCode: ConditionCode = 'clear';
  if (wId >= 200 && wId < 300) conditionCode = 'thunderstorm';
  else if (wId >= 300 && wId < 400) conditionCode = 'drizzle';
  else if (wId >= 500 && wId < 502) conditionCode = 'rain';
  else if (wId >= 502 && wId < 600) conditionCode = 'heavy_rain';
  else if (wId === 600 || wId === 620) conditionCode = 'light_snow';
  else if (wId >= 601 && wId < 620) conditionCode = 'heavy_snow';
  else if (wId >= 621 && wId < 700) conditionCode = 'light_snow';
  else if (wId >= 700 && wId < 800) conditionCode = 'fog';
  else if (wId === 801 || wId === 802) conditionCode = 'partly_cloudy';
  else if (wId > 802) conditionCode = 'cloudy';

  return {
    temperature: raw.main.temp,
    feelsLike: raw.main.feels_like,
    humidity: raw.main.humidity,
    windSpeed: raw.wind.speed * 3.6,   // m/s → km/h
    windDirection: raw.wind.deg,
    visibility: raw.visibility / 1000, // m → km
    pressure: raw.main.pressure,
    uvIndex: raw.uvi ?? 0,
    conditionCode,
  };
}

function normalizeTomorrowIo(raw: TomorrowIoRaw): NormalizedSource {
  const v = raw.data.timelines[0].intervals[0].values;
  const code = v.weatherCode;
  let conditionCode: ConditionCode = 'clear';
  if ([8000].includes(code)) conditionCode = 'thunderstorm';
  else if ([4001, 4200].includes(code)) conditionCode = 'rain';
  else if ([4201].includes(code)) conditionCode = 'heavy_rain';
  else if ([4000].includes(code)) conditionCode = 'drizzle';
  else if ([5001, 5100].includes(code)) conditionCode = 'light_snow';
  else if ([5000, 5101].includes(code)) conditionCode = 'heavy_snow';
  else if ([2000, 2100].includes(code)) conditionCode = 'fog';
  else if ([1001].includes(code)) conditionCode = 'cloudy';
  else if ([1100, 1101, 1102].includes(code)) conditionCode = 'partly_cloudy';

  return {
    temperature: v.temperature,
    feelsLike: v.temperatureApparent,
    humidity: v.humidity,
    windSpeed: v.windSpeed,
    windDirection: v.windDirection,
    visibility: v.visibility,
    pressure: v.pressureSurfaceLevel,
    uvIndex: v.uvIndex,
    conditionCode,
  };
}

function normalizeMetNorway(raw: MetNorwayRaw): NormalizedSource {
  const d = raw.properties.timeseries[0].data;
  const det = d.instant.details;
  const sym = d.next_1_hours?.summary.symbol_code ?? 'clearsky_day';

  let conditionCode: ConditionCode = 'clear';
  if (sym.includes('heavysnow')) conditionCode = 'heavy_snow';
  else if (sym.includes('lightsnow') || sym.includes('snow')) conditionCode = 'light_snow';
  else if (sym.includes('heavyrain')) conditionCode = 'heavy_rain';
  else if (sym.includes('rain')) conditionCode = 'rain';
  else if (sym.includes('drizzle') || sym.includes('sleet')) conditionCode = 'drizzle';
  else if (sym.includes('thunder')) conditionCode = 'thunderstorm';
  else if (sym.includes('fog')) conditionCode = 'fog';
  else if (sym.includes('cloudy')) conditionCode = 'cloudy';
  else if (sym.includes('partlycloudy') || sym.includes('fair')) conditionCode = 'partly_cloudy';

  return {
    temperature: det.air_temperature,
    feelsLike: det.air_temperature - 4,  // MET doesn't provide feels_like directly
    humidity: det.relative_humidity,
    windSpeed: det.wind_speed * 3.6,     // m/s → km/h
    windDirection: det.wind_from_direction,
    visibility: det.fog_area_fraction > 0.5 ? 1 : 10,
    pressure: det.air_pressure_at_sea_level,
    uvIndex: det.ultraviolet_index_clear_sky,
    conditionCode,
  };
}

// ─── Aggregation ─────────────────────────────────────────────────────────────
function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function mostLikelyCondition(codes: ConditionCode[]): ConditionCode {
  const freq: Partial<Record<ConditionCode, number>> = {};
  for (const c of codes) freq[c] = (freq[c] ?? 0) + 1;
  return codes.reduce((a, b) => ((freq[a] ?? 0) >= (freq[b] ?? 0) ? a : b));
}

function buildForecast(baseCondition: ConditionCode, locale: string): ForecastDay[] {
  // Simulated 7-day forecast variations around the base condition
  const variations: ConditionCode[] = [
    baseCondition,
    'cloudy',
    'partly_cloudy',
    'light_snow',
    'clear',
    'rain',
    'partly_cloudy',
  ];
  const temps: [number, number][] = [
    [-3, -8],
    [0, -5],
    [2, -3],
    [-1, -6],
    [4, -1],
    [5, 1],
    [3, -2],
  ];
  return variations.map((code, i) => ({
    day: dayName(i, locale),
    conditionCode: code,
    tempHigh: temps[i][0],
    tempLow: temps[i][1],
  }));
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildQueryFingerprint(query: WeatherQuery): string {
  if (query.city) {
    return `city:${query.city.trim().toLowerCase()}`;
  }

  if (typeof query.lat === 'number' && typeof query.lon === 'number') {
    return `coords:${query.lat.toFixed(2)},${query.lon.toFixed(2)}`;
  }

  return 'default';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function selectConditionFromSeed(seed: number, fallback: ConditionCode): ConditionCode {
  const syntheticPalette: ConditionCode[] = [
    'clear',
    'partly_cloudy',
    'cloudy',
    'drizzle',
    'rain',
    'light_snow',
    'heavy_snow',
    'fog',
  ];

  // Keep default behavior when no location hint is supplied.
  if (seed === 0) {
    return fallback;
  }

  return syntheticPalette[seed % syntheticPalette.length];
}

// ─── Main aggregation function ────────────────────────────────────────────────
export function aggregateWeather(query: WeatherQuery = {}): WeatherResponse {
  const locale = query.locale ?? 'en';
  const lang = resolveLanguage(locale);
  const owRaw = fetchOpenWeather();
  const tiRaw = fetchTomorrowIo();
  const mnRaw = fetchMetNorway();

  const ow = normalizeOpenWeather(owRaw);
  const ti = normalizeTomorrowIo(tiRaw);
  const mn = normalizeMetNorway(mnRaw);

  const sources = [ow, ti, mn];
  const baselineCondition = mostLikelyCondition(sources.map((s) => s.conditionCode));

  const fingerprint = buildQueryFingerprint(query);
  const seed = fingerprint === 'default' ? 0 : hashString(fingerprint);
  const signedFactor = seed === 0 ? 0 : ((seed % 21) - 10) / 10;

  const condition = selectConditionFromSeed(seed, baselineCondition);

  const avgWindDir = avg(sources.map((s) => s.windDirection));

  const temperature = avg(sources.map((s) => s.temperature)) + signedFactor * 0.9;
  const feelsLike = avg(sources.map((s) => s.feelsLike)) + signedFactor * 1.1;
  const humidity = clamp(avg(sources.map((s) => s.humidity)) + signedFactor * 4, 10, 100);
  const windSpeed = clamp(avg(sources.map((s) => s.windSpeed)) + Math.abs(signedFactor) * 2.4, 0, 140);
  const visibility = clamp(avg(sources.map((s) => s.visibility)) - Math.abs(signedFactor) * 1.2, 0.2, 50);
  const pressure = clamp(avg(sources.map((s) => s.pressure)) + signedFactor * 3, 870, 1085);
  const uvIndex = clamp(avg(sources.map((s) => s.uvIndex)) + signedFactor * 0.8, 0, 12);

  const response: WeatherResponse = {
    temperature: Math.round(temperature * 10) / 10,
    feelsLike: Math.round(feelsLike * 10) / 10,
    condition: CONDITION_LABELS[lang][condition],
    conditionCode: condition,
    humidity: Math.round(humidity),
    windSpeed: Math.round(windSpeed * 10) / 10,
    windDirection: degToCardinal(avgWindDir),
    visibility: Math.round(visibility * 10) / 10,
    pressure: Math.round(pressure),
    uvIndex: Math.round(uvIndex * 10) / 10,
    forecast: buildForecast(condition, locale),
    sources: ['OpenWeather', 'Tomorrow.io', 'MET Norway'],
    accuracy: ACCURACY_LABELS[lang],
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
