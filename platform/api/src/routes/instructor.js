const express = require('express');
const router = express.Router();
const prisma = require('../db');

const STUB_INSTRUCTOR_EMAIL = 'jake.scott@rocketacademy.edu.au';

router.get('/instructor/sessions', async (req, res, next) => {
  try {
    const instructor = await prisma.staff.findUnique({
      where: { email: STUB_INSTRUCTOR_EMAIL },
      select: { id: true },
    });

    if (!instructor) {
      return res.status(503).json({ error: 'Stub instructor not seeded. Run: cd platform/api && npx prisma db seed' });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const sessions = await prisma.session.findMany({
      where: {
        leadInstructorId: instructor.id,
        scheduledAt: { gte: startOfDay, lt: endOfDay },
      },
      include: {
        cohort: {
          include: {
            program: true,
            campus: true,
            _count: {
              select: {
                enrolments: { where: { status: 'ACTIVE' } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(sessions.map(s => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      status: s.status,
      cohort: {
        name: s.cohort.name,
        room: s.cohort.room,
        program: { name: s.cohort.program.name },
        campus: { name: s.cohort.campus.name },
      },
      enrolledCount: s.cohort._count.enrolments,
    })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
