# Architecture

## Directory Structure

```
backend/src/
  server.ts          # Express app factory, Vite middleware in dev
  routes/locations.ts # CRUD + refresh + nickname PATCH
  db.ts              # Drizzle ORM layer (sqlite-proxy, auto-migrations on startup)
  schema.ts          # Drizzle table definition (locations)
  weather.ts         # SingaporeWeatherClient (data.gov.sg)
  logger.ts          # Pino logger

frontend/src/
  App.tsx            # ThemeProvider → StoreProvider → Layout
  api.ts             # Typed fetch wrappers for /api/*
  types.ts           # Location, WeatherSnapshot, StoreValue interfaces
  state/store.tsx    # React Context: locations, selection, CRUD actions
  state/ThemeProvider.tsx # React Context: theme + localStorage
  components/        # UI components (Layout, Hero, Sidebar, Tiles, MapCard, etc.)
  index.css          # Tailwind + CSS custom properties (theme variables)
```

## Tech Stack

| Layer    | Choice                                                              |
| -------- | ------------------------------------------------------------------- |
| Backend  | Express 4, Node.js native `node:sqlite`, Drizzle ORM (sqlite-proxy) |
| Frontend | React 18, Vite 7, Tailwind CSS 3, Leaflet + react-leaflet           |
| Language | TypeScript 5.7 (strict)                                             |
| Tests    | Vitest 4.1, supertest, @testing-library/react, fast-check           |
| Lint     | ESLint 9 + Prettier 3.8                                             |

## State Management

- **Backend:** Stateless Express handlers → Drizzle → SQLite file
- **Frontend:** Two independent React Contexts (StoreProvider for data, ThemeProvider for visuals)

## Key Patterns

- **Dependency injection:** `createLocationsRouter({ weatherClient })` enables test mocking
- **Drizzle proxy driver:** Node.js `DatabaseSync` wrapped in a custom callback adapter
- **Auto-migrations:** Applied on server startup from `backend/drizzle/` folder
- **Shared utility:** `getDisplayName()` resolves display name: nickname → area → coordinates
