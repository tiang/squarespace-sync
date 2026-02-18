const request = require('supertest');

jest.mock('../db', () => ({
  session: {
    findUnique: jest.fn(),
  },
  attendance: {
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const app = require('../app');
const prisma = require('../db');

const FAKE_SESSION = {
  id: 'session-uuid-456',
  scheduledAt: new Date('2026-02-18T05:00:00.000Z'),
  durationMinutes: 75,
  status: 'SCHEDULED',
  cohort: {
    name: 'Junior Engineers — Term 1 2026',
    room: 'Room A',
    campus: { name: 'Werribee' },
    enrolments: [
      {
        student: { id: 'student-uuid-1', firstName: 'Liam', lastName: 'Nguyen' },
      },
      {
        student: { id: 'student-uuid-2', firstName: 'Charlotte', lastName: 'Tran' },
      },
    ],
  },
  attendances: [
    { id: 'att-uuid-1', studentId: 'student-uuid-1', status: 'PRESENT', notes: null },
  ],
};

describe('GET /api/v1/sessions/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.session.findUnique.mockResolvedValue(FAKE_SESSION);
  });

  it('returns 200 with session shape', async () => {
    const res = await request(app).get('/api/v1/sessions/session-uuid-456');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'session-uuid-456',
      durationMinutes: 75,
      status: 'SCHEDULED',
      cohort: { name: 'Junior Engineers — Term 1 2026', room: 'Room A' },
      campus: { name: 'Werribee' },
    });
  });

  it('returns students array with attendance merged', async () => {
    const res = await request(app).get('/api/v1/sessions/session-uuid-456');
    const { students } = res.body;
    expect(Array.isArray(students)).toBe(true);
    expect(students).toHaveLength(2);

    const liam = students.find(s => s.firstName === 'Liam');
    expect(liam.attendance).toMatchObject({ status: 'PRESENT' });

    const charlotte = students.find(s => s.firstName === 'Charlotte');
    expect(charlotte.attendance).toBeNull();
  });

  it('returns 404 when session not found', async () => {
    prisma.session.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/sessions/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/sessions/:id/attendance', () => {
  const VALID_RECORDS = [
    { studentId: 'student-uuid-1', status: 'PRESENT', notes: null },
    { studentId: 'student-uuid-2', status: 'ABSENT', notes: 'Called in sick' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(ops => Promise.all(ops));
    prisma.attendance.upsert.mockResolvedValue({});
  });

  it('returns 204 on success', async () => {
    const res = await request(app)
      .put('/api/v1/sessions/session-uuid-456/attendance')
      .send({ records: VALID_RECORDS });
    expect(res.status).toBe(204);
  });

  it('calls upsert for each record', async () => {
    await request(app)
      .put('/api/v1/sessions/session-uuid-456/attendance')
      .send({ records: VALID_RECORDS });
    expect(prisma.attendance.upsert).toHaveBeenCalledTimes(2);
  });

  it('returns 400 when records is missing', async () => {
    const res = await request(app)
      .put('/api/v1/sessions/session-uuid-456/attendance')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when status is invalid', async () => {
    const res = await request(app)
      .put('/api/v1/sessions/session-uuid-456/attendance')
      .send({ records: [{ studentId: 'student-uuid-1', status: 'MAYBE' }] });
    expect(res.status).toBe(400);
  });
});
