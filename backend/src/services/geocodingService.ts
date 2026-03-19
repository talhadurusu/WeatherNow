import { CitySuggestion } from '../types/weather';

interface OpenMeteoGeoResponse {
  results?: Array<{
    name: string;
    country?: string;
    country_code?: string;
    latitude: number;
    longitude: number;
  }>;
}

function normalizeLocale(locale?: string): string {
  if (!locale) return 'en';
  const safe = locale.trim();
  return safe.length > 16 ? 'en' : safe;
}

export async function searchCities(query: string, locale?: string): Promise<CitySuggestion[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    name: q,
    count: '7',
    language: normalizeLocale(locale),
    format: 'json',
  });

  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!res.ok) {
    return [];
  }

  const payload = (await res.json()) as OpenMeteoGeoResponse;
  const results = payload.results ?? [];

  return results.map((item) => {
    const city = item.name ?? 'Unknown';
    const country = item.country ?? 'Unknown';
    const countryCode = (item.country_code ?? '').toUpperCase();
    return {
      city,
      country,
      countryCode,
      lat: Math.round(item.latitude * 100) / 100,
      lon: Math.round(item.longitude * 100) / 100,
      displayName: countryCode ? `${city}, ${countryCode}` : `${city}, ${country}`,
    };
  });
}

export async function reverseGeocode(lat: number, lon: number, locale?: string): Promise<Pick<CitySuggestion, 'city' | 'country' | 'countryCode' | 'displayName'>> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    count: '1',
    language: normalizeLocale(locale),
    format: 'json',
  });

  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?${params.toString()}`);
  if (!res.ok) {
    return {
      city: 'Unknown',
      country: 'Unknown',
      countryCode: '',
      displayName: 'Unknown location',
    };
  }

  const payload = (await res.json()) as OpenMeteoGeoResponse;
  const first = payload.results?.[0];
  if (!first) {
    return {
      city: 'Unknown',
      country: 'Unknown',
      countryCode: '',
      displayName: 'Unknown location',
    };
  }

  const city = first.name ?? 'Unknown';
  const country = first.country ?? 'Unknown';
  const countryCode = (first.country_code ?? '').toUpperCase();
  return {
    city,
    country,
    countryCode,
    displayName: countryCode ? `${city}, ${countryCode}` : `${city}, ${country}`,
  };
}
