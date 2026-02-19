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

// POST /api/v1/staff
router.post('/staff', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, role } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ error: 'firstName, lastName, email, and role are required' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const staff = await prisma.staff.create({
      data: { firstName, lastName, email, phone: phone || null, role },
    });

    res.status(201).json(staff);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A staff member with this email already exists' });
    }
    next(err);
  }
});

module.exports = router;
