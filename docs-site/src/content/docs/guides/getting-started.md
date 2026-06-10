---
title: Getting Started
description: How to set up and run the Weather Starter project locally.
---

## Prerequisites

- **Node.js** 22+ (uses native `node:sqlite`)
- **npm** 10+

## Installation

```bash
git clone <repo-url> weather-starter
cd weather-starter
npm install
```

## Environment Variables

Copy the example env file and adjust as needed:

```bash
cp .env.example .env
```

| Variable          | Purpose                                  | Default              |
| ----------------- | ---------------------------------------- | -------------------- |
| `WEATHER_API_KEY` | data.gov.sg API key (optional)           | (none)               |
| `PORTLESS_PORT`   | Local dev server port                    | `1355`               |
| `DATABASE_PATH`   | SQLite database file path                | `backend/weather.db` |

The app works without an API key for light local usage. A key raises your rate limit.

## Running in Development

```bash
npm run dev
```

This launches a single process serving both backend and frontend at `http://127.0.0.1:1355`:

- Backend runs via `tsx watch` with auto-restart on file changes
- Frontend uses Vite middleware for full HMR

## Building for Production

```bash
npm run build    # TypeScript compile + Vite build
npm run start    # Serve compiled backend + static frontend
```

## Utility Commands

| Command          | Description                               |
| ---------------- | ----------------------------------------- |
| `npm test`       | Run all tests (Vitest, single pass)       |
| `npm run lint`   | ESLint across the monorepo                |
| `npm run format` | Prettier format all files                 |
| `npm run doctor` | Verify environment setup                  |
| `npm run reset`  | Delete all data from the SQLite database  |
| `npm run docs`   | Start documentation site (Astro Starlight)|
