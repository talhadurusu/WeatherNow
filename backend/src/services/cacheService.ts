import { WeatherQuery, WeatherResponse } from '../types/weather';
import { aggregateWeather } from '../services/weatherService';
import { createHash } from 'crypto';

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
  data: WeatherResponse;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function buildCacheKey(query: WeatherQuery): string {
  let raw = `default|locale:${(query.locale ?? 'en').toLowerCase()}`;

  if (query.city) {
    raw = `city:${query.city.trim().toLowerCase()}|country:${(query.country ?? '').trim().toLowerCase()}|cc:${(query.countryCode ?? '').trim().toLowerCase()}|locale:${(query.locale ?? 'en').toLowerCase()}`;
  } else if (typeof query.lat === 'number' && typeof query.lon === 'number') {
    raw = `coords:${query.lat.toFixed(2)},${query.lon.toFixed(2)}|mode:${query.sourceMode ?? 'gps'}|locale:${(query.locale ?? 'en').toLowerCase()}`;
  }

  const digest = createHash('sha256').update(raw).digest('hex').slice(0, 20);
  return `q:${digest}`;
}

export function getCachedWeather(query: WeatherQuery = {}): WeatherResponse {
  const now = Date.now();
  const key = buildCacheKey(query);
  const entry = cache.get(key);

  if (entry && now < entry.expiresAt) {
    return entry.data;
  }

  const fresh = aggregateWeather(query);
  cache.set(key, { data: fresh, expiresAt: now + CACHE_TTL_MS });
  return fresh;
}

export function invalidateCache(query?: WeatherQuery): void {
  if (!query) {
    cache.clear();
    return;
  }

  cache.delete(buildCacheKey(query));
}
