import { useQuery } from '@tanstack/react-query';
import type { WeatherResponse } from '../types/weather';

async function fetchWeather(): Promise<WeatherResponse> {
  const res = await fetch('/api/weather');
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json() as Promise<WeatherResponse>;
}

export function useWeather() {
  return useQuery<WeatherResponse, Error>({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 30_000,          // treat data as fresh for 30 s
    refetchInterval: 60_000,    // background refetch every 60 s
    refetchOnWindowFocus: true,
  });
}
