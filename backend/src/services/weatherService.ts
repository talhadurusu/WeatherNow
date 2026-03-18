import {
  WeatherResponse,
  ForecastDay,
  OpenWeatherRaw,
  TomorrowIoRaw,
  MetNorwayRaw,
} from '../types/weather';

// ─── Turkish day-name helpers ────────────────────────────────────────────────
const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function trDay(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return TR_DAYS[d.getDay()];
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

const CONDITION_LABELS: Record<ConditionCode, string> = {
  heavy_snow: 'Yoğun Kar Yağışlı',
  light_snow: 'Hafif Kar Yağışlı',
  heavy_rain: 'Şiddetli Yağmurlu',
  rain: 'Yağmurlu',
  drizzle: 'Çiseleyen Yağmur',
  thunderstorm: 'Fırtınalı',
  fog: 'Sisli',
  cloudy: 'Bulutlu',
  partly_cloudy: 'Parçalı Bulutlu',
  clear: 'Açık',
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

function buildForecast(baseCondition: ConditionCode): ForecastDay[] {
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
    day: trDay(i),
    conditionCode: code,
    tempHigh: temps[i][0],
    tempLow: temps[i][1],
  }));
}

// ─── Main aggregation function ────────────────────────────────────────────────
export function aggregateWeather(): WeatherResponse {
  const owRaw = fetchOpenWeather();
  const tiRaw = fetchTomorrowIo();
  const mnRaw = fetchMetNorway();

  const ow = normalizeOpenWeather(owRaw);
  const ti = normalizeTomorrowIo(tiRaw);
  const mn = normalizeMetNorway(mnRaw);

  const sources = [ow, ti, mn];
  const condition = mostLikelyCondition(sources.map((s) => s.conditionCode));

  const avgWindDir = avg(sources.map((s) => s.windDirection));

  const response: WeatherResponse = {
    temperature: Math.round(avg(sources.map((s) => s.temperature)) * 10) / 10,
    feelsLike: Math.round(avg(sources.map((s) => s.feelsLike)) * 10) / 10,
    condition: CONDITION_LABELS[condition],
    conditionCode: condition,
    humidity: Math.round(avg(sources.map((s) => s.humidity))),
    windSpeed: Math.round(avg(sources.map((s) => s.windSpeed)) * 10) / 10,
    windDirection: degToCardinal(avgWindDir),
    visibility: Math.round(avg(sources.map((s) => s.visibility)) * 10) / 10,
    pressure: Math.round(avg(sources.map((s) => s.pressure))),
    uvIndex: Math.round(avg(sources.map((s) => s.uvIndex)) * 10) / 10,
    forecast: buildForecast(condition),
    sources: ['OpenWeather', 'Tomorrow.io', 'MET Norway'],
    accuracy: 'Harmanlanmış 3 Kaynak (Yüksek Doğruluk)',
    lastUpdated: new Date().toISOString(),
  };

  return response;
}
