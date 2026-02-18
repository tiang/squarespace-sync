const request = require('supertest');

jest.mock('../db', () => ({
  staff: {
    findUnique: jest.fn(),
  },
  session: {
    findMany: jest.fn(),
  },
}));

const app = require('../app');
const prisma = require('../db');

const FAKE_INSTRUCTOR_ID = 'instructor-uuid-123';

const FAKE_SESSION = {
  id: 'session-uuid-456',
  scheduledAt: new Date('2026-02-18T05:00:00.000Z'),
  durationMinutes: 75,
  status: 'SCHEDULED',
  cohort: {
    name: 'Junior Engineers — Term 1 2026',
    room: 'Room A',
    program: { name: 'Junior Engineers' },
    campus: { name: 'Werribee' },
    _count: { enrolments: 6 },
  },
};

describe('GET /api/v1/instructor/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.findUnique.mockResolvedValue({ id: FAKE_INSTRUCTOR_ID });
    prisma.session.findMany.mockResolvedValue([FAKE_SESSION]);
  });

  it('returns 200 with an array of sessions', async () => {
    const res = await request(app).get('/api/v1/instructor/sessions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('looks up stub instructor by email', async () => {
    await request(app).get('/api/v1/instructor/sessions');
    expect(prisma.staff.findUnique).toHaveBeenCalledWith({
      where: { email: 'jake.scott@rocketacademy.edu.au' },
      select: { id: true },
    });
  });

  it('returns sessions with expected shape', async () => {
    const res = await request(app).get('/api/v1/instructor/sessions');
    const session = res.body[0];
    expect(session).toMatchObject({
      id: FAKE_SESSION.id,
      durationMinutes: 75,
      status: 'SCHEDULED',
      enrolledCount: 6,
      cohort: {
        name: 'Junior Engineers — Term 1 2026',
        room: 'Room A',
        program: { name: 'Junior Engineers' },
        campus: { name: 'Werribee' },
      },
    });
  });

  it('returns 503 when stub instructor not found in DB', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/instructor/sessions');
    expect(res.status).toBe(503);
  });
});
