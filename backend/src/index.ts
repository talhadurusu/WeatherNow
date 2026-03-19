import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import weatherRouter from './routes/weather';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Allowed frontend origin ─────────────────────────────────────────────────
// In production set FRONTEND_ORIGIN env var to your deployed frontend URL.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

function ensureValidOrigin(origin: string): string {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Origin must use http or https protocol');
    }
    return parsed.origin;
  } catch {
    throw new Error('FRONTEND_ORIGIN must be a valid absolute URL (example: https://weather.example.com).');
  }
}

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_ORIGIN) {
  throw new Error('FRONTEND_ORIGIN is required in production.');
}

const validatedFrontendOrigin = ensureValidOrigin(FRONTEND_ORIGIN);

app.disable('x-powered-by');

// ─── Helmet – secure HTTP headers ────────────────────────────────────────────
// Configures Content-Security-Policy, X-Frame-Options, X-Content-Type-Options,
// Strict-Transport-Security, Referrer-Policy, and many more by default.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        connectSrc: ["'self'"],
      },
    },
  }),
);

// ─── CORS – strict single-origin allowlist ───────────────────────────────────
const corsOptions: cors.CorsOptions = {
  origin: validatedFrontendOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
// Respond to preflight requests on all routes
app.options('*', cors(corsOptions));

// ─── Rate limiter – protect all /api/* routes ────────────────────────────────
// 100 requests per 15 minutes per IP.  Tight limit on the weather endpoint
// specifically (see routes/weather.ts).
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: 'draft-8', // Return rate-limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ─── Body parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // reject oversized bodies

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/weather', weatherRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Server ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`WeatherNow backend running on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${validatedFrontendOrigin}`);
  if (!process.env.OPENWEATHER_API_KEY) {
    console.warn('OPENWEATHER_API_KEY is not set. Using Open-Meteo fallback provider only.');
  }
});

export default app;
