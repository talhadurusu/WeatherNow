import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getCachedWeather } from '../services/cacheService';
import { validateWeatherBody, validateWeatherQuery } from '../middleware/validate';
import { WeatherQuery } from '../types/weather';

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

// GET /api/weather?city=<name>  or  GET /api/weather?lat=<lat>&lon=<lon>
router.get('/', weatherLimiter, validateWeatherQuery, (req: Request, res: Response) => {
  try {
    const query: WeatherQuery = {};

    if (typeof req.query.city === 'string') {
      query.city = req.query.city;
    }

    if (typeof req.query.lat === 'string' && typeof req.query.lon === 'string') {
      query.lat = parseFloat(req.query.lat);
      query.lon = parseFloat(req.query.lon);
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
router.post('/', weatherLimiter, validateWeatherBody, (req: Request, res: Response) => {
  try {
    const query: WeatherQuery = {
      lat: req.body.lat as number,
      lon: req.body.lon as number,
    };

    const weather = getCachedWeather(query);
    res.json(weather);
  } catch {
    // Do not print request payload details to avoid leaking location data.
    console.error('Weather endpoint failed (POST).');
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export default router;
