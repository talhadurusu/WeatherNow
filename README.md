# WeatherNow

A full-stack weather application that aggregates real-time data from multiple weather APIs (OpenWeather, Tomorrow.io, MET Norway) and presents it through a visually rich, animated React interface with Turkish localization.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Security](#security)

---

## Features

- **Multi-source aggregation** — Fetches data from OpenWeather, Tomorrow.io, and MET Norway, then averages the results for higher accuracy.
- **Consensus-based condition** — Picks the most frequently reported weather condition across all three sources.
- **7-day forecast** — Daily high/low temperatures and condition codes for the coming week.
- **Rich animated UI** — Dynamic gradient backgrounds, particle snow/rain effects, and animated weather icons that adapt to the current condition and time of day.
- **Night/day mode** — Automatically switches visuals based on local time.
- **Comprehensive metrics** — Temperature, feels-like, humidity, wind speed & direction, visibility, pressure, and UV index.
- **Turkish localization** — All condition labels and day names are displayed in Turkish.
- **Auto-refresh** — Data re-fetches every 60 seconds and on window focus.
- **Smart caching** — 60-second server-side cache reduces unnecessary upstream calls.

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express 4 | HTTP server and routing |
| TypeScript 5 | Type-safe server code |
| Helmet | Secure HTTP response headers |
| CORS | Strict single-origin allowlist |
| express-rate-limit | Global (100 req/15 min) and per-route (30 req/min) rate limiting |
| ts-node-dev | Hot-reloading development server |

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | Component-based UI |
| Vite 8 | Build tool and dev server |
| TypeScript 5 | Type-safe client code |
| TanStack React Query 5 | Data fetching, caching, and background refetch |
| Inline CSS + keyframes | Animations and responsive styling |
| ESLint | Code quality |

### Monorepo

| Technology | Purpose |
|---|---|
| npm workspaces | Shared dependency management |
| concurrently | Runs backend and frontend simultaneously in one terminal |

---

## Architecture

```
Browser (React + Vite)
        │
        │  GET /api/weather?city=...
        ▼
Express API (port 3001)
  ├── Helmet (security headers)
  ├── CORS (strict origin check)
  ├── Rate limiter (global + per-route)
  ├── Input validator (city / lat+lon)
  ├── Cache layer (60-second TTL)
  └── Weather aggregator
        ├── fetch OpenWeather  (simulated)
        ├── fetch Tomorrow.io  (simulated)
        └── fetch MET Norway   (simulated)
              │
              ▼
        Normalize → Average → Consensus condition
              │
              ▼
        WeatherResponse JSON
```

> **Note:** The three external API calls are currently simulated with realistic static data. Swap the `fetchOpenWeather`, `fetchTomorrowIo`, and `fetchMetNorway` functions in `backend/src/services/weatherService.ts` with real HTTP calls to go live.

---

## Project Structure

```
WeatherNow/
├── package.json                  # Monorepo root – dev/build/start scripts
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app, security middleware
│   │   ├── routes/
│   │   │   └── weather.ts        # GET /api/weather (30 req/min limit)
│   │   ├── services/
│   │   │   ├── weatherService.ts # Multi-source aggregation & normalization
│   │   │   └── cacheService.ts   # In-memory 60-second cache
│   │   ├── middleware/
│   │   │   └── validate.ts       # Query-param validation (city / lat, lon)
│   │   └── types/
│   │       └── weather.ts        # Shared TypeScript interfaces
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── src/
    │   ├── main.tsx              # React entry point
    │   ├── App.tsx               # Root – loading/error states
    │   ├── components/
    │   │   ├── WeatherCard.tsx   # Main display (gradient, temp, badge)
    │   │   ├── WeatherIcon.tsx   # SVG icons per condition code
    │   │   ├── WeatherStats.tsx  # Humidity, wind, visibility, pressure grid
    │   │   ├── ForecastPanel.tsx # 7-day forecast cards
    │   │   ├── ParticleEffect.tsx# Animated snow/rain particles
    │   │   └── LampEffect.tsx    # Night-mode street lamp visual
    │   ├── hooks/
    │   │   └── useWeather.ts     # React Query hook (60 s refetch)
    │   └── types/
    │       └── weather.ts        # Client-side TypeScript interfaces
    ├── vite.config.ts            # Port 3000, proxies /api/* → localhost:3001
    ├── eslint.config.js
    └── package.json
```

---

## Quick Start

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install dependencies

```bash
npm run install:all
```

### Start in development mode

```bash
npm run dev
```

This launches both servers concurrently:

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:3000 |
| Backend (Express) | http://localhost:3001 |

The Vite dev server automatically proxies `/api/*` requests to the backend, so no manual CORS configuration is required during development.

### Build for production

```bash
npm run build
```

Compiled backend output: `backend/dist/`  
Compiled frontend output: `frontend/dist/`

### Start production servers

```bash
npm start
```

---

## Available Scripts

Run these from the **repository root**:

| Script | Description |
|---|---|
| `npm run install:all` | Install all workspace dependencies |
| `npm run dev` | Start backend + frontend with hot reload |
| `npm run build` | Compile backend TypeScript and build frontend |
| `npm start` | Run compiled backend and Vite preview |

Run these from the **`frontend/` directory**:

| Script | Description |
|---|---|
| `npm run lint` | ESLint validation |
| `npm run preview` | Preview the production build locally |

---

## API Reference

### `GET /api/weather`

Returns aggregated weather data.

**Query parameters** (provide one):

| Parameter | Type | Example | Description |
|---|---|---|---|
| `city` | string | `Istanbul` | City name (Unicode letters, spaces, hyphens, dots) |
| `lat` + `lon` | number | `41.01&lon=28.97` | Latitude (−90 to 90) and longitude (−180 to 180) |

**Success response `200`**

```json
{
  "temperature": -3.2,
  "feelsLike": -6.7,
  "condition": "Hafif Kar Yağışlı",
  "conditionCode": "light_snow",
  "humidity": 82,
  "windSpeed": 19.4,
  "windDirection": "NW",
  "visibility": 6.1,
  "pressure": 1012,
  "uvIndex": 0.0,
  "forecast": [
    { "day": "Pzt", "conditionCode": "light_snow", "tempHigh": -3, "tempLow": -8 }
  ],
  "sources": ["OpenWeather", "Tomorrow.io", "MET Norway"],
  "accuracy": "Harmanlanmış 3 Kaynak (Yüksek Doğruluk)",
  "lastUpdated": "2024-12-01T10:30:00.000Z"
}
```

**Error responses**

| Status | Meaning |
|---|---|
| `400` | Missing or invalid query parameters |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

### `GET /health`

Returns server liveness status.

```json
{ "status": "ok", "timestamp": "2024-12-01T10:30:00.000Z" }
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the Express server listens on |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed CORS origin (set to your deployed frontend URL in production) |

---

## Security

- **Helmet** sets `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, and other headers automatically.
- **CORS** restricts cross-origin requests to a single explicitly configured origin.
- **Rate limiting** — 100 requests per 15 minutes globally; 30 requests per minute on the weather endpoint.
- **Input validation** — City names are validated against a Unicode-aware regex; latitude and longitude are checked for valid numeric ranges. Invalid input is rejected with a `400` before any service logic runs.
- **Body size limit** — JSON request bodies are capped at 10 KB to prevent payload-based denial-of-service attacks.