import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { WeatherResponse } from '../types/weather';

type WeatherLocation =
  | { mode: 'none' }
  | { mode: 'city'; city: string }
  | { mode: 'coords'; lat: number; lon: number };

interface UseWeatherResult {
  data: WeatherResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  needsManualCity: boolean;
  locationMode: WeatherLocation['mode'];
  setManualCity: (city: string) => void;
  requestGeolocation: () => void;
}

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

async function fetchWeather(location: WeatherLocation): Promise<WeatherResponse> {
  let res: Response;

  if (location.mode === 'coords') {
    res = await fetch('/api/weather', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: location.lat, lon: location.lon }),
    });
  } else if (location.mode === 'city') {
    const city = encodeURIComponent(location.city);
    res = await fetch(`/api/weather?city=${city}`);
  } else {
    throw new Error('Location not selected');
  }

  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json() as Promise<WeatherResponse>;
}

export function useWeather(): UseWeatherResult {
  const geolocationInitialized = useRef(false);
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
        setLocation({ mode: 'coords', lat, lon });
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

  const query = useQuery<WeatherResponse, Error>({
    queryKey: ['weather', location],
    queryFn: () => fetchWeather(location),
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
    setManualCity,
    requestGeolocation,
  };
}
