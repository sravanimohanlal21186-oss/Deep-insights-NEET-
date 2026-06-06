const express = require('express');
const request = require('supertest');
const app = require('../server/index.js');

describe('API Health Checks', () => {
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('GET /ready returns 200 when dependencies available', async () => {
    const res = await request(app).get('/ready');
    expect(res.statusCode).toBe(200);
  });

  test('GET /metrics returns prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
  });
});

describe('Questions API', () => {
  test('GET /api/questions returns paginated questions', async () => {
    const res = await request(app).get('/api/questions?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('questions');
    expect(res.body).toHaveProperty('pagination');
  });
});

describe('Rate Limiting', () => {
  test('Exceeding rate limit returns 429', async () => {
    for (let i = 0; i < 1001; i++) {
      await request(app).get('/api/questions');
    }
    const res = await request(app).get('/api/questions');
    expect(res.statusCode).toBe(429);
  }, 60000);
});

describe('Error Handling', () => {
  test('Invalid route returns 404', async () => {
    const res = await request(app).get('/invalid-route');
    expect(res.statusCode).toBe(404);
  });
});
