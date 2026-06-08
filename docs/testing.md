# Testing Patterns

## Running Tests

```bash
npm test                   # All tests, single pass
npm run test:watch         # Watch mode
npx vitest run <path>      # Single file
```

## Configuration

- `vitest.config.ts` at workspace root
- Includes: `backend/src/**/*.test.ts` and `frontend/src/**/*.test.{ts,tsx}`
- Pool: `forks`, `fileParallelism: false`
- Env: `NODE_ENV=test`, `LOG_LEVEL=silent`

## Backend Tests

- Use **supertest** against the Express app
- Weather client is injected via `createApp({ weatherClient: mockClient })`
- Database uses a temp directory (`mkdtemp`) cleaned up in `afterAll`
- Set `serveFrontend: false` and `enableRequestLogging: false` for test isolation

## Frontend Tests

- Require `// @vitest-environment jsdom` at top of file
- Mock `react-leaflet` components as simple `<div>` elements with `data-testid`
- Mock the store via `vi.mock('../state/store', ...)`
- Use `vi.useFakeTimers()` for animation/timeout testing (remember `vi.advanceTimersByTime`)
- Mock `leaflet` itself (divIcon, Icon.Default)

## Property-Based Tests

- Library: `fast-check` (already in devDependencies)
- Minimum 100 iterations per property
- Used for: marker count invariants, display name resolution, nickname validation
