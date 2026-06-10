import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { WeatherSnapshot } from '../weather.js';

const weather: WeatherSnapshot = {
  condition: 'Cloudy',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'test',
  area: 'Bishan',
  valid_period_text: 'Now',
  temperature_c: 29,
  humidity_percent: 80,
  rainfall_mm: 0,
  wind_speed_knots: 4,
  wind_direction_degrees: 180,
  forecast_low_c: 25,
  forecast_high_c: 32,
  uv_index: 7,
  psi_twenty_four_hourly: 42,
  pm25_one_hourly: 9,
  air_quality_region: 'central',
  forecast_periods: [{ label: 'Now', forecast: 'Cloudy' }],
  daily_forecast: [
    { date: '2026-05-04', forecast: 'Cloudy', temperature_low_c: 25, temperature_high_c: 32 },
  ],
};

describe('locations API', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          return weather;
        },
      },
    });
  });

  beforeEach(async () => {
    const { resetStore } = await import('../db.js');
    await resetStore();
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EBUSY') throw error;
    });
  });

  it('refreshes weather when a location is created', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 1,
      latitude: 1.35,
      longitude: 103.85,
      weather: {
        condition: 'Cloudy',
        area: 'Bishan',
        temperature_c: 29,
      },
    });

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(listResponse.body.locations).toHaveLength(1);
    expect(listResponse.body.locations[0].weather.condition).toBe('Cloudy');
  });

  it('rejects an exact duplicate and identifies the existing location', async () => {
    await request(app).post('/api/locations').send({ latitude: 1.35, longitude: 103.85 }).expect(201);

    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(409);

    expect(response.body).toEqual({
      detail: 'Nearby location already exists',
      existingLocationId: 1,
    });
  });

  it('rejects a location within 100 meters and allows one outside the threshold', async () => {
    await request(app).post('/api/locations').send({ latitude: 1.35, longitude: 103.85 }).expect(201);

    const nearby = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.3505, longitude: 103.85 })
      .expect(409);
    expect(nearby.body.existingLocationId).toBe(1);

    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.351, longitude: 103.85 })
      .expect(201);
  });

  it('retains Singapore coordinate validation', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.6, longitude: 103.85 })
      .expect(422);

    expect(response.body.detail).toContain('within Singapore');
  });
});
