import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getCachedWeather } from '../services/cacheService';
import { validateWeatherQuery } from '../middleware/validate';

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
router.get('/', weatherLimiter, validateWeatherQuery, (_req: Request, res: Response) => {
  try {
    const weather = getCachedWeather();
    res.json(weather);
  } catch {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export default router;
