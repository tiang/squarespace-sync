const { verifyIdToken } = require('../lib/firebaseAdmin');
const prisma = require('../db');

/**
 * Express middleware: verifies Firebase ID token, resolves Family by email.
 * Attaches req.familyId and req.userEmail on success.
 * Returns 401 for missing/invalid token, 403 { code: 'FAMILY_NOT_FOUND' } if
 * the authenticated email doesn't match any Family.primaryEmail.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);

  let decoded;
  try {
    decoded = await verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Phone OTP sign-in produces tokens with phone_number but no email.
  // Family lookup is currently by primaryEmail only. Phone-only sessions
  // will always reach the account-not-found help form until phone-number
  // lookup is implemented (requires Family.primaryPhone to be unique).
  if (!decoded.email) {
    return res.status(403).json({ code: 'FAMILY_NOT_FOUND' });
  }

  const family = await prisma.family.findUnique({
    where: { primaryEmail: decoded.email },
    select: { id: true },
  });

  if (!family) {
    return res.status(403).json({ code: 'FAMILY_NOT_FOUND' });
  }

  req.familyId = family.id;
  req.userEmail = decoded.email;
  next();
}

module.exports = requireAuth;
