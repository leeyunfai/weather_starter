# API Endpoints

All routes prefixed with `/api`.

| Method | Endpoint                 | Description                                                             |
| ------ | ------------------------ | ----------------------------------------------------------------------- |
| GET    | `/locations`             | List all saved locations with weather                                   |
| POST   | `/locations`             | Create location (body: `{ latitude, longitude }`, auto-fetches weather) |
| GET    | `/locations/:id`         | Get single location                                                     |
| PATCH  | `/locations/:id`         | Update nickname (body: `{ nickname }`, empty string clears)             |
| DELETE | `/locations/:id`         | Delete location                                                         |
| POST   | `/locations/:id/refresh` | Re-fetch weather data from provider                                     |
| POST   | `/logs`                  | Log frontend interaction event                                          |
| GET    | `/health`                | Health check (no /api prefix)                                           |

## Nickname Validation (PATCH)

- Trim input; whitespace-only → store null
- Max 50 characters after trim → 422
- Non-string or missing field → 422
- Non-existent location → 404

## Location Creation Validation (POST)

- Must provide numeric `latitude` and `longitude`
- Must be within Singapore bounds (lat 1.1–1.5, lon 103.6–104.1) → 422
- Duplicate coordinates → 409
