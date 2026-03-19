import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getCachedWeather } from '../services/cacheService';
import { validateCitySearchQuery, validateWeatherBody, validateWeatherQuery } from '../middleware/validate';
import { WeatherQuery } from '../types/weather';
import { reverseGeocode, searchCities } from '../services/geocodingService';

const router = Router();

// ─── Endpoint-level rate limiter ─────────────────────────────────────────────
// Stricter than the global limiter: 30 requests per minute per IP.
// This protects against targeted abuse of the weather endpoint specifically.
const weatherLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many weather requests, please slow down.' },
});

const citySearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 24,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many city search requests, please slow down.' },
});

// GET /api/weather?city=<name>  or  GET /api/weather?lat=<lat>&lon=<lon>
router.get('/', weatherLimiter, validateWeatherQuery, async (req: Request, res: Response) => {
  try {
    const query: WeatherQuery = {};

    if (typeof req.query.city === 'string') {
      query.city = req.query.city;
    }

    if (typeof req.query.locale === 'string') {
      query.locale = req.query.locale;
    }

    if (query.city && !query.country) {
      const suggestions = await searchCities(query.city, query.locale);
      if (suggestions.length > 0) {
        query.city = suggestions[0].city;
        query.country = suggestions[0].country;
        query.countryCode = suggestions[0].countryCode;
      }
    }

    if (typeof req.query.lat === 'string' && typeof req.query.lon === 'string') {
      query.lat = parseFloat(req.query.lat);
      query.lon = parseFloat(req.query.lon);
      query.sourceMode = 'gps';

      const place = await reverseGeocode(query.lat, query.lon, query.locale);
      query.city = place.city;
      query.country = place.country;
      query.countryCode = place.countryCode;
    }

    const weather = getCachedWeather(query);
    res.json(weather);
  } catch {
    // Do not print request payload details to avoid leaking location data.
    console.error('Weather endpoint failed (GET).');
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// POST /api/weather with JSON body: { "lat": number, "lon": number }
router.post('/', weatherLimiter, validateWeatherBody, async (req: Request, res: Response) => {
  try {
    const lat = req.body.lat as number;
    const lon = req.body.lon as number;

    const query: WeatherQuery = {
      lat,
      lon,
      locale: (req.body.locale as string | undefined) ?? 'en',
      sourceMode: (req.body.sourceMode as WeatherQuery['sourceMode']) ?? 'gps',
    };

    if (typeof req.body.city === 'string') {
      query.city = req.body.city;
    }

    if (typeof req.body.country === 'string') {
      query.country = req.body.country;
    }

    if (typeof req.body.countryCode === 'string') {
      query.countryCode = req.body.countryCode;
    }

    if (!query.city || !query.country) {
      const place = await reverseGeocode(lat, lon, query.locale);
      query.city = place.city;
      query.country = place.country;
      query.countryCode = place.countryCode;
    }

    const weather = getCachedWeather(query);
    res.json(weather);
  } catch {
    // Do not print request payload details to avoid leaking location data.
    console.error('Weather endpoint failed (POST).');
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

router.get('/cities', citySearchLimiter, validateCitySearchQuery, async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const locale = req.query.locale as string | undefined;
    const suggestions = await searchCities(q, locale);
    res.json({ suggestions });
  } catch {
    console.error('City search endpoint failed.');
    res.status(500).json({ error: 'Failed to fetch city suggestions' });
  }
});

export default router;
