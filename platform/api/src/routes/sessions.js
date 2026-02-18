const express = require('express');
const router = express.Router();
const prisma = require('../db');

const VALID_STATUSES = new Set(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);

router.get('/sessions/:id', async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        cohort: {
          include: {
            campus: true,
            enrolments: {
              where: { status: 'ACTIVE' },
              include: { student: true },
            },
          },
        },
        attendances: true,
      },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const attendanceMap = new Map(session.attendances.map(a => [a.studentId, a]));

    res.json({
      id: session.id,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      status: session.status,
      cohort: { name: session.cohort.name, room: session.cohort.room },
      campus: { name: session.cohort.campus.name },
      students: session.cohort.enrolments.map(e => {
        const att = attendanceMap.get(e.student.id);
        return {
          id: e.student.id,
          firstName: e.student.firstName,
          lastName: e.student.lastName,
          attendance: att ? { id: att.id, status: att.status, notes: att.notes } : null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/sessions/:id/attendance', async (req, res, next) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'records must be an array' });
    }

    for (const r of records) {
      if (!r.studentId || !VALID_STATUSES.has(r.status)) {
        return res.status(400).json({ error: `Invalid record: ${JSON.stringify(r)}` });
      }
    }

    await prisma.$transaction(
      records.map(r =>
        prisma.attendance.upsert({
          where: { sessionId_studentId: { sessionId: req.params.id, studentId: r.studentId } },
          create: {
            sessionId: req.params.id,
            studentId: r.studentId,
            status: r.status,
            notes: r.notes ?? null,
          },
          update: {
            status: r.status,
            notes: r.notes ?? null,
          },
        })
      )
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
