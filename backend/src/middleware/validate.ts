import { Request, Response, NextFunction } from 'express';

// Allowed query parameters and their validation rules for /api/weather
const CITY_RE = /^[\p{L}\p{M}\s\-'.]{1,100}$/u;          // Unicode letters, spaces, hyphens, apostrophes, dots
const COORD_RE = /^-?\d{1,3}(\.\d{1,8})?$/;               // decimal latitude / longitude
const LOCALE_RE = /^[a-zA-Z]{2,3}([-_][a-zA-Z]{2,4})?$/;

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

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
  const { city, lat, lon, locale, ...rest } = req.query;

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

  if (locale !== undefined) {
    if (typeof locale !== 'string' || !LOCALE_RE.test(locale)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid locale value.' });
      return;
    }
    req.query['locale'] = locale.replace('_', '-');
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

/**
 * Validates POST /api/weather JSON body for privacy-preserving coordinate input.
 * Only lat/lon are accepted and values are rounded to 2 decimals server-side.
 */
export function validateWeatherBody(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Body must be a JSON object with lat and lon.',
    });
    return;
  }

  const { lat, lon, city, country, countryCode, locale, sourceMode, ...rest } = req.body as Record<string, unknown>;

  if (Object.keys(rest).length > 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: `Unknown body field(s): ${Object.keys(rest).join(', ')}`,
    });
    return;
  }

  if (typeof lat !== 'number' || !Number.isFinite(lat)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid latitude value.' });
    return;
  }

  if (typeof lon !== 'number' || !Number.isFinite(lon)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid longitude value.' });
    return;
  }

  if (lat < -90 || lat > 90) {
    res.status(400).json({ error: 'Bad Request', message: 'Latitude must be between -90 and 90.' });
    return;
  }

  if (lon < -180 || lon > 180) {
    res.status(400).json({ error: 'Bad Request', message: 'Longitude must be between -180 and 180.' });
    return;
  }

  if (city !== undefined && (typeof city !== 'string' || !CITY_RE.test(city))) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid city value.' });
    return;
  }

  if (country !== undefined && typeof country !== 'string') {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid country value.' });
    return;
  }

  if (countryCode !== undefined && typeof countryCode !== 'string') {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid country code value.' });
    return;
  }

  if (locale !== undefined && (typeof locale !== 'string' || !LOCALE_RE.test(locale))) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid locale value.' });
    return;
  }

  if (sourceMode !== undefined && sourceMode !== 'gps' && sourceMode !== 'manual' && sourceMode !== 'city') {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid source mode.' });
    return;
  }

  req.body.lat = roundToTwoDecimals(lat);
  req.body.lon = roundToTwoDecimals(lon);
  if (typeof city === 'string') req.body.city = city.trim();
  if (typeof country === 'string') req.body.country = country.trim();
  if (typeof countryCode === 'string') req.body.countryCode = countryCode.trim().toUpperCase();
  if (typeof locale === 'string') req.body.locale = locale.replace('_', '-');
  if (sourceMode !== undefined) req.body.sourceMode = sourceMode;

  next();
}

export function validateCitySearchQuery(req: Request, res: Response, next: NextFunction): void {
  const { q, locale, ...rest } = req.query;

  if (Object.keys(rest).length > 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: `Unknown query parameter(s): ${Object.keys(rest).join(', ')}`,
    });
    return;
  }

  if (typeof q !== 'string' || q.trim().length < 2 || q.trim().length > 100 || !CITY_RE.test(q.trim())) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid city search query.' });
    return;
  }

  if (locale !== undefined) {
    if (typeof locale !== 'string' || !LOCALE_RE.test(locale)) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid locale value.' });
      return;
    }
    req.query['locale'] = locale.replace('_', '-');
  }

  req.query['q'] = q.trim();
  next();
}
