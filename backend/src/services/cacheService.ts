import { WeatherResponse } from '../types/weather';
import { aggregateWeather } from '../services/weatherService';

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
  data: WeatherResponse;
  expiresAt: number;
}

let cache: CacheEntry | null = null;

export function getCachedWeather(): WeatherResponse {
  const now = Date.now();

  if (cache && now < cache.expiresAt) {
    return cache.data;
  }

  const fresh = aggregateWeather();
  cache = { data: fresh, expiresAt: now + CACHE_TTL_MS };
  return fresh;
}

export function invalidateCache(): void {
  cache = null;
}
