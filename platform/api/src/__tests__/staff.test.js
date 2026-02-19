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

describe('POST /api/v1/staff', () => {
  const validBody = {
    firstName: 'Mia',
    lastName: 'Chen',
    email: 'mia@rocketacademy.edu.au',
    role: 'LEAD_INSTRUCTOR',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.create.mockResolvedValue({ ...FAKE_STAFF });
  });

  it('returns 201 with the created staff', async () => {
    const res = await request(app).post('/api/v1/staff').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('mia@rocketacademy.edu.au');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/v1/staff').send({ firstName: 'Mia' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when role is not a valid enum value', async () => {
    const res = await request(app).post('/api/v1/staff').send({ ...validBody, role: 'MANAGER' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    prisma.staff.create.mockRejectedValue({ code: 'P2002' });
    const res = await request(app).post('/api/v1/staff').send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });
});

describe('PATCH /api/v1/staff/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.findUnique.mockResolvedValue(FAKE_STAFF);
    prisma.staff.update.mockResolvedValue({ ...FAKE_STAFF, firstName: 'Updated' });
  });

  it('returns 200 with updated staff', async () => {
    const res = await request(app).patch('/api/v1/staff/staff-uuid-1').send({ firstName: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Updated');
  });

  it('returns 404 when staff not found', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);
    const res = await request(app).patch('/api/v1/staff/bad-id').send({ firstName: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 404 when staff is inactive', async () => {
    prisma.staff.findUnique.mockResolvedValue({ ...FAKE_STAFF, isActive: false });
    const res = await request(app).patch('/api/v1/staff/staff-uuid-1').send({ firstName: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when role is invalid', async () => {
    const res = await request(app).patch('/api/v1/staff/staff-uuid-1').send({ role: 'MANAGER' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    prisma.staff.update.mockRejectedValue({ code: 'P2002' });
    const res = await request(app).patch('/api/v1/staff/staff-uuid-1').send({ email: 'taken@example.com' });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/v1/staff/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.staff.findUnique.mockResolvedValue(FAKE_STAFF);
    prisma.staff.update.mockResolvedValue({ ...FAKE_STAFF, isActive: false });
  });

  it('returns 200 with deactivation message', async () => {
    const res = await request(app).delete('/api/v1/staff/staff-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('calls update with isActive: false', async () => {
    await request(app).delete('/api/v1/staff/staff-uuid-1');
    expect(prisma.staff.update).toHaveBeenCalledWith({
      where: { id: 'staff-uuid-1' },
      data: { isActive: false },
    });
  });

  it('returns 404 when staff not found', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);
    const res = await request(app).delete('/api/v1/staff/bad-id');
    expect(res.status).toBe(404);
  });

  it('returns 404 when staff is already inactive', async () => {
    prisma.staff.findUnique.mockResolvedValue({ ...FAKE_STAFF, isActive: false });
    const res = await request(app).delete('/api/v1/staff/staff-uuid-1');
    expect(res.status).toBe(404);
  });
});
