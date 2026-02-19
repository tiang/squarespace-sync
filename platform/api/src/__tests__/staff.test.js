const request = require('supertest');

jest.mock('../db', () => ({
  staff: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const app = require('../app');
const prisma = require('../db');

const FAKE_STAFF = {
  id: 'staff-uuid-1',
  firstName: 'Mia',
  lastName: 'Chen',
  email: 'mia@rocketacademy.edu.au',
  phone: '+61 400 000 001',
  role: 'LEAD_INSTRUCTOR',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GET /api/v1/staff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.findMany.mockResolvedValue([FAKE_STAFF]);
  });

  it('returns 200 with staff array', async () => {
    const res = await request(app).get('/api/v1/staff');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.staff)).toBe(true);
    expect(res.body.staff).toHaveLength(1);
  });

  it('filters by isActive=true by default', async () => {
    await request(app).get('/api/v1/staff');
    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it('omits isActive filter when includeInactive=true', async () => {
    await request(app).get('/api/v1/staff?includeInactive=true');
    const callArg = prisma.staff.findMany.mock.calls[0][0];
    expect(callArg.where).not.toHaveProperty('isActive');
  });

  it('adds role filter when role param provided', async () => {
    await request(app).get('/api/v1/staff?role=LEAD_INSTRUCTOR');
    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: 'LEAD_INSTRUCTOR' }),
      })
    );
  });

  it('adds OR search filter when search param provided', async () => {
    await request(app).get('/api/v1/staff?search=mia');
    const callArg = prisma.staff.findMany.mock.calls[0][0];
    expect(callArg.where.OR).toBeDefined();
    expect(callArg.where.OR).toHaveLength(3);
  });

  it('returns 400 when role param is not a valid enum value', async () => {
    const res = await request(app).get('/api/v1/staff?role=GARBAGE');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('orders results by lastName ascending', async () => {
    await request(app).get('/api/v1/staff');
    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { lastName: 'asc' },
      })
    );
  });
});
