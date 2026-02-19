const express = require('express');
const router = express.Router();
const prisma = require('../db');

const VALID_ROLES = ['ADMIN', 'LEAD_INSTRUCTOR', 'TEACHING_ASSISTANT'];

// GET /api/v1/staff
router.get('/staff', async (req, res, next) => {
  try {
    const { role, search, includeInactive } = req.query;

    const where = {};

    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
      }
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: { lastName: 'asc' },
    });

    res.json({ staff });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
