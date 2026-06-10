import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { WeatherSnapshot } from './weather.js';

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

describe('GET /health', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('./server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-test-health-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('./server.js');
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

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EBUSY') throw error;
    });
  });

  it('returns healthy status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'healthy' });
  });
});

describe('POST /api/logs', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('./server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-test-logs-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('./server.js');
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

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EBUSY') throw error;
    });
  });

  it('accepts a valid frontend log event and returns 204', async () => {
    await request(app)
      .post('/api/logs')
      .send({ event: 'page.view', metadata: { page: '/dashboard' } })
      .expect(204);
  });

  it('accepts event with dotted notation', async () => {
    await request(app).post('/api/logs').send({ event: 'location.created' }).expect(204);
  });

  it('rejects missing event field', async () => {
    const response = await request(app).post('/api/logs').send({}).expect(422);
    expect(response.body.detail).toContain('event is required');
  });

  it('rejects non-string event', async () => {
    const response = await request(app).post('/api/logs').send({ event: 123 }).expect(422);

    expect(response.body.detail).toContain('event is required');
  });

  it('rejects event with invalid characters', async () => {
    const response = await request(app)
      .post('/api/logs')
      .send({ event: 'INVALID EVENT!' })
      .expect(422);

    expect(response.body.detail).toContain('event is required');
  });

  it('rejects event starting with a non-lowercase letter', async () => {
    const response = await request(app).post('/api/logs').send({ event: '1invalid' }).expect(422);

    expect(response.body.detail).toContain('event is required');
  });
});
