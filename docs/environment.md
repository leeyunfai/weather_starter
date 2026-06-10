# Environment & Dev Workflow

## Environment Variables

| Variable          | Purpose                                                | Default              |
| ----------------- | ------------------------------------------------------ | -------------------- |
| `WEATHER_API_KEY` | data.gov.sg API key (optional, for higher rate limits) | (none)               |
| `PORTLESS_PORT`   | Local dev server port                                  | `1355`               |
| `PORTLESS_HTTPS`  | Enable HTTPS in dev                                    | `0`                  |
| `DATABASE_PATH`   | SQLite file path                                       | `backend/weather.db` |

Copy `.env.example` to `.env` to configure.

## Development

```bash
npm run dev
```

This runs `scripts/dev.mjs` which:

1. Launches backend via `tsx watch backend/src/server.ts` (auto-restarts on file changes)
2. Uses **portless** for a stable local URL (default: `http://127.0.0.1:1355`)
3. In dev mode, Express embeds Vite middleware — frontend gets full HMR

Both backend and frontend are served from a single process.

## Production

```bash
npm run build   # tsc + vite build
npm run start   # runs scripts/start.mjs → node with compiled backend serving static frontend
```

## Utility Scripts

| Script           | Purpose                                               |
| ---------------- | ----------------------------------------------------- |
| `npm run doctor` | Verify environment (Node version, dependencies, etc.) |
| `npm run reset`  | Delete all data from the SQLite database              |

## Git Hooks

- **Husky v9** with a pre-commit hook (`.husky/pre-commit`)
- Currently runs lint-staged or similar (check the hook file for current config)
