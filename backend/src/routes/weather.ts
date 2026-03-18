import { Router, Request, Response } from 'express';
import { getCachedWeather } from '../services/cacheService';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const weather = getCachedWeather();
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export default router;
