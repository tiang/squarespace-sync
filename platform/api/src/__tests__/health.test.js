const request = require('supertest');

jest.mock('../db', () => ({
  $connect: jest.fn().mockResolvedValue(undefined),
}));

const app = require('../app');

describe('GET /api/health', () => {
  it('returns 200 with status ok when DB connects', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 503 when DB connection fails', async () => {
    const prisma = require('../db');
    prisma.$connect.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.db).toBe('disconnected');
  });
});
