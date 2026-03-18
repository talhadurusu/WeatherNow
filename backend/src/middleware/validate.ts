import { Request, Response, NextFunction } from 'express';

// Allowed query parameters and their validation rules for /api/weather
const CITY_RE = /^[\p{L}\p{M}\s\-'.]{1,100}$/u;          // Unicode letters, spaces, hyphens, apostrophes, dots
const COORD_RE = /^-?\d{1,3}(\.\d{1,8})?$/;               // decimal latitude / longitude

/**
 * Validates and sanitizes recognised query parameters for the weather endpoint.
 * Any parameter that is present but fails validation is rejected immediately
 * (fail-closed strategy) to prevent injection of malformed data into downstream
 * services or logging pipelines.
 *
 * Supported optional parameters:
 *   ?city=<city name>        – up to 100 Unicode letter/space chars
 *   ?lat=<latitude>          – decimal number in [-90, 90]
 *   ?lon=<longitude>         – decimal number in [-180, 180]
 *
 * Unknown query parameters are silently stripped from req.query so they never
 * reach route handlers.
 */
export function validateWeatherQuery(req: Request, res: Response, next: NextFunction): void {
  const { city, lat, lon, ...rest } = req.query;

  // Reject unknown / extra query parameters
  if (Object.keys(rest).length > 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: `Unknown query parameter(s): ${Object.keys(rest).join(', ')}`,
    });
    return;
  }

  // Validate city name
  if (city !== undefined) {
    if (typeof city !== 'string' || !CITY_RE.test(city)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid city name. Use only letters, spaces, hyphens, apostrophes, or dots (max 100 chars).',
      });
      return;
    }
    // Store sanitized city back (trim whitespace)
    req.query['city'] = city.trim();
  }

  // Validate lat / lon (must be provided together or not at all)
  const hasLat = lat !== undefined;
  const hasLon = lon !== undefined;

  if (hasLat !== hasLon) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Both lat and lon must be provided together.',
    });
    return;
  }

  if (hasLat && hasLon) {
    if (typeof lat !== 'string' || !COORD_RE.test(lat)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid latitude value.' });
      return;
    }
    if (typeof lon !== 'string' || !COORD_RE.test(lon)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid longitude value.' });
      return;
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (latNum < -90 || latNum > 90) {
      res.status(400).json({ error: 'Bad Request', message: 'Latitude must be between -90 and 90.' });
      return;
    }
    if (lonNum < -180 || lonNum > 180) {
      res.status(400).json({ error: 'Bad Request', message: 'Longitude must be between -180 and 180.' });
      return;
    }
  }

  next();
}
