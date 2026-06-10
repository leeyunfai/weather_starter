import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { WeatherSnapshot } from '../weather.js';
import { WeatherProviderError } from '../weather.js';

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

describe('GET /api/locations/:locationId', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-test-get-'));
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

  it('returns a single location by id', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    const response = await request(app).get(`/api/locations/${created.body.id}`).expect(200);

    expect(response.body).toMatchObject({
      id: created.body.id,
      latitude: 1.35,
      longitude: 103.85,
      weather: { condition: 'Cloudy' },
    });
  });

  it('returns 404 for a non-existent location', async () => {
    const response = await request(app).get('/api/locations/9999').expect(404);
    expect(response.body.detail).toBe('Location not found');
  });
});

describe('DELETE /api/locations/:locationId', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-test-del-'));
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

  it('deletes an existing location and returns 204', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    await request(app).delete(`/api/locations/${created.body.id}`).expect(204);

    // Verify it's gone
    await request(app).get(`/api/locations/${created.body.id}`).expect(404);
  });

  it('returns 404 when deleting a non-existent location', async () => {
    const response = await request(app).delete('/api/locations/9999').expect(404);
    expect(response.body.detail).toBe('Location not found');
  });

  it('removes location from the list after deletion', async () => {
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    const created2 = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.4, longitude: 103.9 })
      .expect(201);

    await request(app).delete(`/api/locations/${created2.body.id}`).expect(204);

    const list = await request(app).get('/api/locations').expect(200);
    expect(list.body.locations).toHaveLength(1);
    expect(list.body.locations[0].latitude).toBe(1.35);
  });
});

describe('PATCH /api/locations/:locationId (nickname)', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-test-patch-'));
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

  it('updates nickname for an existing location', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    const response = await request(app)
      .patch(`/api/locations/${created.body.id}`)
      .send({ nickname: 'Home' })
      .expect(200);

    expect(response.body.nickname).toBe('Home');
  });

  it('clears nickname when empty string is provided', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    await request(app)
      .patch(`/api/locations/${created.body.id}`)
      .send({ nickname: 'Home' })
      .expect(200);

    const response = await request(app)
      .patch(`/api/locations/${created.body.id}`)
      .send({ nickname: '' })
      .expect(200);

    expect(response.body.nickname).toBeNull();
  });

  it('trims whitespace from nickname', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    const response = await request(app)
      .patch(`/api/locations/${created.body.id}`)
      .send({ nickname: '  Office  ' })
      .expect(200);

    expect(response.body.nickname).toBe('Office');
  });

  it('rejects nickname exceeding 50 characters', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    const longNickname = 'A'.repeat(51);
    const response = await request(app)
      .patch(`/api/locations/${created.body.id}`)
      .send({ nickname: longNickname })
      .expect(422);

    expect(response.body.error).toContain('maximum length');
  });

  it('returns 422 when nickname field is missing', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    const response = await request(app)
      .patch(`/api/locations/${created.body.id}`)
      .send({})
      .expect(422);

    expect(response.body.error).toContain('nickname');
  });

  it('returns 404 for a non-existent location', async () => {
    const response = await request(app)
      .patch('/api/locations/9999')
      .send({ nickname: 'Ghost' })
      .expect(404);

    expect(response.body.error).toBe('Location not found');
  });
});

describe('POST /api/locations/:locationId/refresh', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;
  let weatherResult: WeatherSnapshot | Error = weather;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-test-refresh-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          if (weatherResult instanceof Error) throw weatherResult;
          return weatherResult;
        },
      },
    });
  });

  beforeEach(async () => {
    const { resetStore } = await import('../db.js');
    await resetStore();
    weatherResult = weather;
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EBUSY') throw error;
    });
  });

  it('refreshes weather for an existing location', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    const updatedWeather: WeatherSnapshot = {
      ...weather,
      condition: 'Sunny',
      temperature_c: 33,
    };
    weatherResult = updatedWeather;

    const response = await request(app)
      .post(`/api/locations/${created.body.id}/refresh`)
      .expect(200);

    expect(response.body.weather.condition).toBe('Sunny');
    expect(response.body.weather.temperature_c).toBe(33);
  });

  it('returns 404 for a non-existent location', async () => {
    const response = await request(app).post('/api/locations/9999/refresh').expect(404);

    expect(response.body.detail).toBe('Location not found');
  });

  it('returns 502 when weather provider fails', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    weatherResult = new WeatherProviderError('Provider timeout');

    const response = await request(app)
      .post(`/api/locations/${created.body.id}/refresh`)
      .expect(502);

    expect(response.body.detail).toBe('Provider timeout');
  });
});

describe('POST /api/locations validation edge cases', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-test-validate-'));
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

  it('rejects missing latitude and longitude', async () => {
    const response = await request(app).post('/api/locations').send({}).expect(422);
    expect(response.body.detail).toContain('latitude and longitude are required');
  });

  it('rejects non-numeric coordinates', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 'abc', longitude: 'xyz' })
      .expect(422);

    expect(response.body.detail).toContain('latitude and longitude are required');
  });

  it('rejects longitude outside Singapore bounds', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 105.0 })
      .expect(422);

    expect(response.body.detail).toContain('within Singapore');
  });

  it('accepts coordinates at Singapore boundary edges', async () => {
    // Lower bounds
    await request(app).post('/api/locations').send({ latitude: 1.1, longitude: 103.6 }).expect(201);

    // Upper bounds
    await request(app).post('/api/locations').send({ latitude: 1.5, longitude: 104.1 }).expect(201);
  });
});
