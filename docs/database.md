# Database & Migrations

## Setup

- **Engine:** SQLite via Node.js native `node:sqlite` (DatabaseSync)
- **ORM:** Drizzle ORM with `sqlite-proxy` driver
- **WAL mode:** Enabled for concurrent read performance
- **File location:** `backend/weather.db` (configurable via `DATABASE_PATH` env var)

## Schema

Single table: `locations`

| Column                       | Type        | Notes                                              |
| ---------------------------- | ----------- | -------------------------------------------------- |
| id                           | INTEGER     | Primary key, auto-increment                        |
| latitude                     | REAL        | Not null                                           |
| longitude                    | REAL        | Not null                                           |
| created_at                   | TEXT        | ISO timestamp                                      |
| nickname                     | TEXT        | Nullable, max 50 chars (enforced at API level)     |
| condition, area, source, ... | TEXT/REAL   | Weather snapshot fields (flattened)                |
| forecast_periods             | TEXT (JSON) | Array of `{ label, forecast }`                     |
| daily_forecast               | TEXT (JSON) | Array of `{ date, forecast, temp_low, temp_high }` |

Unique index on `(latitude, longitude)`.

## Migrations

```bash
npm run db:generate   # After editing backend/src/schema.ts
npm run db:migrate    # Apply via drizzle-kit
```

Migrations live in `backend/drizzle/`. They're also auto-applied on server startup via `migrate()` in `db.ts`.

## Drizzle Config

Located at workspace root: `drizzle.config.ts`. Points to `backend/src/schema.ts` and outputs to `backend/drizzle/`.
