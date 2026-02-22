/**
 * Unit tests for requireAuth middleware.
 * Mocks firebase-admin so no real Firebase project is needed.
 */

jest.mock('../lib/firebaseAdmin');

const { verifyIdToken } = require('../lib/firebaseAdmin');
const requireAuth = require('../middleware/requireAuth');

// Minimal Prisma mock — only needs family.findUnique
jest.mock('../db', () => ({
  family: {
    findUnique: jest.fn(),
  },
}));
const prisma = require('../db');

function mockReqRes() {
  const req = { headers: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => jest.clearAllMocks());

describe('requireAuth middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const { req, res, next } = mockReqRes();
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = 'Bearer bad-token';
    verifyIdToken.mockRejectedValue(new Error('invalid token'));
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 FAMILY_NOT_FOUND when email has no matching family', async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = 'Bearer valid-token';
    verifyIdToken.mockResolvedValue({ email: 'unknown@example.com' });
    prisma.family.findUnique.mockResolvedValue(null);
    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ code: 'FAMILY_NOT_FOUND' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches familyId and userEmail to req and calls next when valid', async () => {
    const { req, res, next } = mockReqRes();
    req.headers.authorization = 'Bearer valid-token';
    verifyIdToken.mockResolvedValue({ email: 'parent@example.com' });
    prisma.family.findUnique.mockResolvedValue({ id: 'fam-123' });
    await requireAuth(req, res, next);
    expect(req.familyId).toBe('fam-123');
    expect(req.userEmail).toBe('parent@example.com');
    expect(next).toHaveBeenCalled();
  });
});
