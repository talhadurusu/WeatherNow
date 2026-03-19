import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CitySuggestion, WeatherResponse } from '../types/weather';
import { detectDeviceLocale } from '../i18n';

type WeatherLocation =
  | { mode: 'none' }
  | { mode: 'city'; city: string; country?: string }
  | { mode: 'coords'; lat: number; lon: number; city?: string; country?: string; countryCode?: string; sourceMode: 'gps' | 'manual' };

interface UseWeatherResult {
  data: WeatherResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  needsManualCity: boolean;
  locationMode: WeatherLocation['mode'];
  locale: string;
  setManualCity: (city: string) => void;
  setManualLocation: (selection: CitySuggestion) => void;
  fetchCitySuggestions: (query: string) => Promise<CitySuggestion[]>;
  requestGeolocation: () => void;
}

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

async function fetchWeather(location: WeatherLocation, locale: string): Promise<WeatherResponse> {
  let res: Response;

  if (location.mode === 'coords') {
    res = await fetch('/api/weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: location.lat,
        lon: location.lon,
        city: location.city,
        country: location.country,
        countryCode: location.countryCode,
        sourceMode: location.sourceMode,
        locale,
      }),
    });
  } else if (location.mode === 'city') {
    const city = encodeURIComponent(location.city);
    const localeParam = encodeURIComponent(locale);
    res = await fetch(`/api/weather?city=${city}&locale=${localeParam}`);
  } else {
    throw new Error('Location not selected');
  }

  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json() as Promise<WeatherResponse>;
}

export function useWeather(): UseWeatherResult {
  const geolocationInitialized = useRef(false);
  const [locale] = useState<string>(() => detectDeviceLocale());
  const [location, setLocation] = useState<WeatherLocation>({ mode: 'none' });
  const [needsManualCity, setNeedsManualCity] = useState(false);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setNeedsManualCity(true);
      setLocation({ mode: 'none' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = roundCoord(position.coords.latitude);
        const lon = roundCoord(position.coords.longitude);
        setLocation({ mode: 'coords', lat, lon, sourceMode: 'gps' });
        setNeedsManualCity(false);
      },
      () => {
        setLocation({ mode: 'none' });
        setNeedsManualCity(true);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 12_000,
      },
    );
  }, []);

  useEffect(() => {
    if (geolocationInitialized.current) return;
    geolocationInitialized.current = true;

    const timer = window.setTimeout(() => {
      requestGeolocation();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [requestGeolocation]);

  const setManualCity = useCallback((city: string) => {
    const normalized = city.trim();
    if (!normalized) return;
    setLocation({ mode: 'city', city: normalized });
    setNeedsManualCity(false);
  }, []);

  const setManualLocation = useCallback((selection: CitySuggestion) => {
    setLocation({
      mode: 'coords',
      lat: roundCoord(selection.lat),
      lon: roundCoord(selection.lon),
      city: selection.city,
      country: selection.country,
      countryCode: selection.countryCode,
      sourceMode: 'manual',
    });
    setNeedsManualCity(false);
  }, []);

  const fetchCitySuggestions = useCallback(async (query: string) => {
    const normalized = query.trim();
    if (normalized.length < 2) return [] as CitySuggestion[];

    const q = encodeURIComponent(normalized);
    const localeParam = encodeURIComponent(locale);
    const res = await fetch(`/api/weather/cities?q=${q}&locale=${localeParam}`);
    if (!res.ok) return [] as CitySuggestion[];

    const payload = (await res.json()) as { suggestions?: CitySuggestion[] };
    return payload.suggestions ?? [];
  }, [locale]);

  const query = useQuery<WeatherResponse, Error>({
    queryKey: ['weather', location, locale],
    queryFn: () => fetchWeather(location, locale),
    enabled: location.mode !== 'none',
    staleTime: 30_000,          // treat data as fresh for 30 s
    refetchInterval: 60_000,    // background refetch every 60 s
    refetchOnWindowFocus: true,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    needsManualCity,
    locationMode: location.mode,
    locale,
    setManualCity,
    setManualLocation,
    fetchCitySuggestions,
    requestGeolocation,
  };
}
