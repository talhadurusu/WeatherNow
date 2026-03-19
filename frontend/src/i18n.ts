export type SupportedLanguage = 'tr' | 'en';

type MessageKey =
  | 'loadingWeather'
  | 'connectionError'
  | 'fetchErrorFallback'
  | 'retryLocation'
  | 'locationSelection'
  | 'locationSelectionHint'
  | 'cityRequired'
  | 'cityPlaceholder'
  | 'continueWithCity'
  | 'retryGeo'
  | 'manualHint'
  | 'go'
  | 'updating'
  | 'night'
  | 'day'
  | 'liveWeather'
  | 'sevenDayForecast'
  | 'lastUpdated'
  | 'today'
  | 'feelsLike'
  | 'humidity'
  | 'wind'
  | 'visibility'
  | 'pressure'
  | 'gpsMode'
  | 'manualMode'
  | 'cityMode'
  | 'searchingCities'
  | 'citySearchFailed'
  | 'citySearchRateLimited'
  | 'noCitiesFound'
  | 'staleDataWarning';

const messages: Record<SupportedLanguage, Record<MessageKey, string>> = {
  tr: {
    loadingWeather: 'Hava durumu yukleniyor...',
    connectionError: 'Baglanti Hatasi',
    fetchErrorFallback: 'Hava durumu verisi alinamadi. Lutfen tekrar deneyin.',
    retryLocation: 'Konumu Tekrar Dene',
    locationSelection: 'Konum Secimi',
    locationSelectionHint: 'Konum izni vermezsen, sehir yazarak devam edebilirsin. Konum bilgisi kaydedilmez.',
    cityRequired: 'Lutfen bir sehir adi girin.',
    cityPlaceholder: 'Ornek: Istanbul',
    continueWithCity: 'Sehirle Devam Et',
    retryGeo: 'Konumu Tekrar Dene',
    manualHint: 'Konum paylasmadan da kullanabilirsin. Lutfen sehir gir.',
    go: 'Git',
    updating: 'Guncelleniyor...',
    night: 'Gece',
    day: 'Gunduz',
    liveWeather: 'Canli Hava Durumu',
    sevenDayForecast: '7 Gunluk Tahmin',
    lastUpdated: 'Son guncelleme',
    today: 'Bugun',
    feelsLike: 'Hissedilen',
    humidity: 'Nem',
    wind: 'Ruzgar',
    visibility: 'Gorus',
    pressure: 'Basinc',
    gpsMode: 'GPS',
    manualMode: 'Manuel',
    cityMode: 'Sehir',
    searchingCities: 'Sehirler araniyor...',
    citySearchFailed: 'Sehir onerileri alinamadi. Lutfen tekrar deneyin.',
    citySearchRateLimited: 'Cok fazla arama yaptin. Lutfen biraz bekle.',
    noCitiesFound: 'Sehir bulunamadi.',
    staleDataWarning: 'Anlik veri alinamadi, onbellekteki son veri gosteriliyor.',
  },
  en: {
    loadingWeather: 'Loading weather...',
    connectionError: 'Connection Error',
    fetchErrorFallback: 'Unable to fetch weather data. Please try again.',
    retryLocation: 'Try Location Again',
    locationSelection: 'Location Selection',
    locationSelectionHint: 'If you do not allow location access, continue by entering a city manually. Location data is not stored.',
    cityRequired: 'Please enter a city name.',
    cityPlaceholder: 'Example: London',
    continueWithCity: 'Continue with City',
    retryGeo: 'Try Location Again',
    manualHint: 'You can continue without sharing location. Please enter a city.',
    go: 'Go',
    updating: 'Updating...',
    night: 'Night',
    day: 'Day',
    liveWeather: 'Live Weather',
    sevenDayForecast: '7-Day Forecast',
    lastUpdated: 'Last updated',
    today: 'Today',
    feelsLike: 'Feels Like',
    humidity: 'Humidity',
    wind: 'Wind',
    visibility: 'Visibility',
    pressure: 'Pressure',
    gpsMode: 'GPS',
    manualMode: 'Manual',
    cityMode: 'City',
    searchingCities: 'Searching cities...',
    citySearchFailed: 'Could not fetch city suggestions. Please try again.',
    citySearchRateLimited: 'Too many searches. Please wait a moment.',
    noCitiesFound: 'No cities found.',
    staleDataWarning: 'Live feed is temporarily unavailable, showing cached data.',
  },
};

export function resolveLocale(locale: string | undefined): SupportedLanguage {
  const normalized = (locale ?? '').toLowerCase();
  if (normalized.startsWith('tr')) return 'tr';
  return 'en';
}

export function detectDeviceLocale(): string {
  return navigator.language || 'en';
}

export function t(locale: string | undefined, key: MessageKey): string {
  const lang = resolveLocale(locale);
  return messages[lang][key];
}
