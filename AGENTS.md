# AGENTS.md — Weather Starter

Singapore weather dashboard. npm workspaces monorepo: `backend/` (Express + SQLite) and `frontend/` (React + Vite + Tailwind).

## Commands

```bash
npm run dev                # Dev server (backend + frontend HMR) at http://127.0.0.1:1355
npm run build              # Build both workspaces
npm test                   # Vitest run (all tests)
npx tsc --noEmit -p backend/tsconfig.json   # Backend type check
npx tsc --noEmit -p frontend/tsconfig.json  # Frontend type check
npm run db:generate        # Generate Drizzle migration after schema change
```

## Critical Constraints

- Locations must be within Singapore: lat 1.1–1.5, lon 103.6–104.1
- Frontend tests require `// @vitest-environment jsdom` file directive
- Theme changes touch 4 files: `index.css`, `ThemeProvider.tsx`, `index.html`, `ThemeSelector.tsx`

## Deep Dives

- [Architecture & Tech Stack](docs/architecture.md)
- [API Endpoints](docs/api.md)
- [Testing Patterns](docs/testing.md)
- [Theming System](docs/theming.md)
- [Database & Migrations](docs/database.md)
- [Environment & Dev Workflow](docs/environment.md)
