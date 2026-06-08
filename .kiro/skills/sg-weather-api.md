---
name: sg-weather-api
description: Singapore Government Weather API reference for data.gov.sg endpoints used by Weather Starter
inclusion: manual
---

# Singapore Weather API Skill

This skill provides reference documentation for the data.gov.sg weather APIs consumed by the `SingaporeWeatherClient` in `backend/src/weather.ts`.

## Base URLs

- **Primary (v2):** `https://api-open.data.gov.sg/v2/real-time/api/`
- **Legacy (v1):** `https://api.data.gov.sg/v1/environment/`

## Authentication

- Optional API key via `x-api-key` header (set via `WEATHER_API_KEY` env var)
- Works without a key for light local usage; key provides higher rate limits

## Endpoints Used

### Two-Hour Forecast
- **URL:** `GET /v2/real-time/api/two-hr-forecast`
- **Returns:** Area-level weather forecasts (condition text per named area)
- **Key fields:** `area_metadata[]` (name + lat/lng), `items[].forecasts[]` (area + forecast text)
- **Used for:** Primary weather condition and area name resolution

### Real-Time Readings
All follow the same response shape:
- **Air Temperature:** `GET /v2/real-time/api/air-temperature`
- **Relative Humidity:** `GET /v2/real-time/api/relative-humidity`
- **Rainfall:** `GET /v2/real-time/api/rainfall`
- **Wind Speed:** `GET /v2/real-time/api/wind-speed`
- **Wind Direction:** `GET /v2/real-time/api/wind-direction`
- **Returns:** `stations[]` (id + lat/lng) and `readings[].data[]` (stationId + value)
- **Resolution:** Nearest station to the user's coordinates

### UV Index
- **URL:** `GET /v2/real-time/api/uv`
- **Returns:** `data.records[].index[]` with hour and value
- **Resolution:** Nationwide (single value)

### PSI (Air Quality)
- **URL:** `GET /v2/real-time/api/psi`
- **Returns:** Regional readings keyed by region name (north, south, east, west, central)
- **Resolution:** Nearest region to coordinates

### PM2.5
- **URL:** `GET /v2/real-time/api/pm25`
- **Returns:** Same structure as PSI, regional readings
- **Resolution:** Nearest region to coordinates

### 24-Hour Forecast
- **URL:** `GET /v2/real-time/api/twenty-four-hr-forecast`
- **Returns:** General temperature (low/high) + period-by-region forecasts
- **Used for:** `forecast_low_c`, `forecast_high_c`, `forecast_periods[]`

### 4-Day Forecast
- **URL:** `GET /v1/environment/4-day-weather-forecast` (legacy endpoint)
- **Returns:** `items[].forecasts[]` with date, forecast text, temperature low/high
- **Used for:** `daily_forecast[]` array

## Response Patterns

All v2 endpoints return:
```json
{
  "code": 0,
  "errorMsg": "",
  "data": { ... }
}
```

A non-zero `code` indicates an error. HTTP 429 = rate limited, 401/403 = bad API key.

## Nearest-Station Algorithm

The client finds the closest station/area to the user's coordinates using Euclidean distance on lat/lng (sufficient for Singapore's small geographic area):

```
distance = (stationLat - userLat)² + (stationLng - userLng)²
```

## Rate Limits & Timeouts

- Default request timeout: 8 seconds
- Rate limit: 429 response (handled by `WeatherProviderError`)
- All API calls are `Promise.all`'d in parallel for speed
- Individual endpoint failures are caught and result in `null` values (graceful degradation)

## Singapore Regions

Five fixed regions used for PSI/PM2.5 resolution:
| Region | Latitude | Longitude |
|--------|----------|-----------|
| west | 1.35735 | 103.7 |
| north | 1.41803 | 103.82 |
| central | 1.35735 | 103.82 |
| south | 1.29587 | 103.82 |
| east | 1.35735 | 103.94 |

## Implementation Notes

- The `SingaporeWeatherClient` class in `backend/src/weather.ts` wraps all these endpoints
- It's injected into the router via `createLocationsRouter({ weatherClient })` for testability
- In tests, a mock client returns fixed weather data without making real API calls
- The `observed_at` timestamp is resolved as the most recent timestamp across all data sources
