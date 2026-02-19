const express = require('express');
const router = express.Router();
const prisma = require('../db');

const STUB_FAMILY_EMAIL = 'nguyen.family@gmail.com';

// ── Helper: resolve stub family or 503 ────────────────────────────────────────
async function getStubFamily(res) {
  const family = await prisma.family.findUnique({
    where: { primaryEmail: STUB_FAMILY_EMAIL },
  });
  if (!family) {
    res.status(503).json({
      error: 'Stub family not seeded. Run: cd platform/api && npx prisma db seed',
    });
    return null;
  }
  return family;
}

// ── GET /api/v1/parent/stub ───────────────────────────────────────────────────
// Returns the stub family with all students and their active enrolments.
router.get('/parent/stub', async (req, res, next) => {
  try {
    const family = await prisma.family.findUnique({
      where: { primaryEmail: STUB_FAMILY_EMAIL },
      include: {
        students: {
          include: {
            enrolments: {
              where: { status: { in: ['ACTIVE', 'TRIAL'] } },
              include: {
                cohort: {
                  include: {
                    program: { select: { name: true } },
                    campus:  { select: { name: true } },
                    sessions: {
                      where: {
                        scheduledAt: { gte: new Date() },
                        status: 'SCHEDULED',
                      },
                      orderBy: { scheduledAt: 'asc' },
                      take: 1,
                      select: { scheduledAt: true, durationMinutes: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!family) {
      return res.status(503).json({
        error: 'Stub family not seeded. Run: cd platform/api && npx prisma db seed',
      });
    }

    res.json({
      id:             family.id,
      name:           family.name,
      primaryEmail:   family.primaryEmail,
      primaryPhone:   family.primaryPhone,
      addressStreet:  family.addressStreet,
      addressCity:    family.addressCity,
      addressState:   family.addressState,
      addressPostcode: family.addressPostcode,
      students: family.students.map(s => ({
        id:        s.id,
        firstName: s.firstName,
        lastName:  s.lastName,
        birthDate: s.birthDate,
        gender:    s.gender,
        enrolments: s.enrolments.map(e => ({
          id:        e.id,
          status:    e.status,
          startDate: e.startDate,
          cohort: {
            id:      e.cohort.id,
            name:    e.cohort.name,
            program: e.cohort.program,
            campus:  e.cohort.campus,
            nextSession: e.cohort.sessions[0] ?? null,
          },
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/stub/students/:studentId/attendance ───────────────────
// Returns all attendance records for a student, newest first.
router.get('/parent/stub/students/:studentId/attendance', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;

    // Security: ensure the student belongs to the stub family
    const student = await prisma.student.findFirst({
      where: { id: req.params.studentId, familyId: family.id },
      select: { id: true },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const records = await prisma.attendance.findMany({
      where: { studentId: req.params.studentId },
      include: {
        session: {
          select: {
            scheduledAt: true,
            durationMinutes: true,
            cohort: { select: { name: true } },
          },
        },
      },
      orderBy: { session: { scheduledAt: 'desc' } },
    });

    res.json(records.map(r => ({
      id:        r.id,
      status:    r.status,
      notes:     r.notes,
      session: {
        scheduledAt:     r.session.scheduledAt,
        durationMinutes: r.session.durationMinutes,
        cohortName:      r.session.cohort.name,
      },
    })));
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/stub/invoices ─────────────────────────────────────────
// Returns all invoices for the stub family (empty array until billing is built).
router.get('/parent/stub/invoices', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;
    // Billing model not yet in schema — return empty array as stub
    res.json([]);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/stub/messages ─────────────────────────────────────────
// Returns all message threads (empty until messaging is built).
router.get('/parent/stub/messages', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;
    res.json([]);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/stub/sessions ─────────────────────────────────────────
// Returns all upcoming sessions (scheduledAt >= today) for all cohorts the
// stub family's students are actively enrolled in. Ordered by scheduledAt asc.
// Includes SCHEDULED and CANCELLED sessions (not COMPLETED — those are past).
router.get('/parent/stub/sessions', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sessions = await prisma.session.findMany({
      where: {
        scheduledAt: { gte: startOfToday },
        status: { not: 'COMPLETED' },
        cohort: {
          enrolments: {
            some: {
              student: { familyId: family.id },
              status: { in: ['ACTIVE', 'TRIAL'] },
            },
          },
        },
      },
      include: {
        cohort: {
          select: {
            name: true,
            campus: { select: { name: true } },
            enrolments: {
              where: {
                student: { familyId: family.id },
                status: { in: ['ACTIVE', 'TRIAL'] },
              },
              select: {
                student: { select: { id: true, firstName: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(
      sessions.map(s => ({
        id:              s.id,
        scheduledAt:     s.scheduledAt,
        durationMinutes: s.durationMinutes,
        status:          s.status,
        cohortName:      s.cohort.name,
        campusName:      s.cohort.campus.name,
        students:        s.cohort.enrolments.map(e => ({
          id:        e.student.id,
          firstName: e.student.firstName,
        })),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/v1/parent/stub ─────────────────────────────────────────────────
// Updates contact details for the stub family. Only whitelisted fields.
router.patch('/parent/stub', async (req, res, next) => {
  try {
    const family = await getStubFamily(res);
    if (!family) return;

    const { name, primaryPhone, addressStreet, addressCity, addressState, addressPostcode } = req.body;

    const updated = await prisma.family.update({
      where: { id: family.id },
      data: {
        ...(name            !== undefined && { name }),
        ...(primaryPhone    !== undefined && { primaryPhone }),
        ...(addressStreet   !== undefined && { addressStreet }),
        ...(addressCity     !== undefined && { addressCity }),
        ...(addressState    !== undefined && { addressState }),
        ...(addressPostcode !== undefined && { addressPostcode }),
      },
      select: {
        id: true, name: true, primaryEmail: true, primaryPhone: true,
        addressStreet: true, addressCity: true, addressState: true, addressPostcode: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
