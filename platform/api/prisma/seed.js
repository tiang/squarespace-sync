const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Seed data ─────────────────────────────────────────────────────────────────
// Gender values use the Gender enum: 'MALE' or 'FEMALE' (not 'M'/'F')
// birthDate is stored as TIMESTAMP(3) in UTC. Use date-only ISO strings (e.g. new Date('2017-03-15'))
// which ECMAScript parses as UTC midnight — safe regardless of server timezone.
// Do NOT use new Date('2017-03-15T00:00:00') — without a trailing 'Z' it parses as local time
// and will silently shift the stored date by up to ±14 hours.

const cohort1Data = [
  {
    family: { name: 'Nguyen Family', primaryEmail: 'nguyen.family@gmail.com', primaryPhone: '0412345678', addressStreet: '14 Parkview Drive', addressCity: 'Werribee', addressState: 'VIC', addressPostcode: '3030' },
    student: { firstName: 'Liam', lastName: 'Nguyen', birthDate: new Date('2017-03-15'), gender: 'MALE' },
  },
  {
    family: { name: 'Tran Family', primaryEmail: 'tran.family@gmail.com', primaryPhone: '0423456789', addressStreet: '7 Bellbird Court', addressCity: 'Hoppers Crossing', addressState: 'VIC', addressPostcode: '3029' },
    student: { firstName: 'Charlotte', lastName: 'Tran', birthDate: new Date('2016-07-22'), gender: 'FEMALE' },
  },
  {
    family: { name: 'Smith Family', primaryEmail: 'smith.family@gmail.com', primaryPhone: '0434567890', addressStreet: '23 Rivervale Way', addressCity: 'Wyndham Vale', addressState: 'VIC', addressPostcode: '3024' },
    student: { firstName: 'Oscar', lastName: 'Smith', birthDate: new Date('2018-01-10'), gender: 'MALE' },
  },
  {
    family: { name: 'Johnson Family', primaryEmail: 'johnson.family@gmail.com', primaryPhone: '0445678901', addressStreet: '5 Sunridge Crescent', addressCity: 'Point Cook', addressState: 'VIC', addressPostcode: '3030' },
    student: { firstName: 'Mia', lastName: 'Johnson', birthDate: new Date('2015-11-30'), gender: 'FEMALE' },
  },
  {
    family: { name: 'Williams Family', primaryEmail: 'williams.family@gmail.com', primaryPhone: '0456789012', addressStreet: '31 Maplewood Avenue', addressCity: 'Werribee', addressState: 'VIC', addressPostcode: '3030' },
    student: { firstName: 'Ethan', lastName: 'Williams', birthDate: new Date('2017-09-05'), gender: 'MALE' },
  },
  {
    family: { name: 'Brown Family', primaryEmail: 'brown.family@gmail.com', primaryPhone: '0467890123', addressStreet: '18 Cloverleaf Street', addressCity: 'Hoppers Crossing', addressState: 'VIC', addressPostcode: '3029' },
    student: { firstName: 'Zoe', lastName: 'Brown', birthDate: new Date('2016-04-18'), gender: 'FEMALE' },
  },
];

const cohort2Data = [
  {
    family: { name: 'Davis Family', primaryEmail: 'davis.family@gmail.com', primaryPhone: '0478901234', addressStreet: '42 Banksia Road', addressCity: 'Tarneit', addressState: 'VIC', addressPostcode: '3029' },
    student: { firstName: 'Noah', lastName: 'Davis', birthDate: new Date('2018-06-25'), gender: 'MALE' },
  },
  {
    family: { name: 'Wilson Family', primaryEmail: 'wilson.family@gmail.com', primaryPhone: '0489012345', addressStreet: '9 Lillypilly Lane', addressCity: 'Wyndham Vale', addressState: 'VIC', addressPostcode: '3024' },
    student: { firstName: 'Isla', lastName: 'Wilson', birthDate: new Date('2015-08-14'), gender: 'FEMALE' },
  },
  {
    family: { name: 'Taylor Family', primaryEmail: 'taylor.family@gmail.com', primaryPhone: '0491123456', addressStreet: '67 Federation Drive', addressCity: 'Werribee', addressState: 'VIC', addressPostcode: '3030' },
    student: { firstName: 'Lucas', lastName: 'Taylor', birthDate: new Date('2017-12-03'), gender: 'MALE' },
  },
  {
    family: { name: 'Anderson Family', primaryEmail: 'anderson.family@gmail.com', primaryPhone: '0402234567', addressStreet: '11 Kurrajong Close', addressCity: 'Point Cook', addressState: 'VIC', addressPostcode: '3030' },
    student: { firstName: 'Amelia', lastName: 'Anderson', birthDate: new Date('2016-02-28'), gender: 'FEMALE' },
  },
  {
    family: { name: 'Thomas Family', primaryEmail: 'thomas.family@gmail.com', primaryPhone: '0413345678', addressStreet: '29 Ironbark Court', addressCity: 'Hoppers Crossing', addressState: 'VIC', addressPostcode: '3029' },
    student: { firstName: 'Finn', lastName: 'Thomas', birthDate: new Date('2018-10-17'), gender: 'MALE' },
  },
  {
    family: { name: 'Jackson Family', primaryEmail: 'jackson.family@gmail.com', primaryPhone: '0424456789', addressStreet: '3 Acacia Way', addressCity: 'Tarneit', addressState: 'VIC', addressPostcode: '3029' },
    student: { firstName: 'Sophie', lastName: 'Jackson', birthDate: new Date('2015-05-09'), gender: 'FEMALE' },
  },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    // ── Cleanup (reverse FK order) ─────────────────────────────────────────
    // Delete leaf → parent to satisfy FK constraints:
    //   attendance  → session, student
    //   enrolment   → student, cohort
    //   session     → cohort, staff
    //   cohort      → program, campus
    //   program     → organisation
    //   campusStaff → campus, staff
    //   student     → family
    //   family      → (no campus FK — campus is derived via enrolments)
    //   staff       → organisation
    //   campus      → organisation
    await tx.attendance.deleteMany();
    await tx.enrolment.deleteMany();
    await tx.session.deleteMany();
    await tx.cohort.deleteMany();
    await tx.program.deleteMany();
    await tx.campusStaff.deleteMany();
    await tx.student.deleteMany();
    await tx.family.deleteMany();
    await tx.staff.deleteMany();
    await tx.campus.deleteMany();
    await tx.organisation.deleteMany();

    // ── Organisation ────────────────────────────────────────────────────────
    const org = await tx.organisation.create({
      data: { name: 'Rocket Academy' },
    });

    // ── Campus ──────────────────────────────────────────────────────────────
    const campus = await tx.campus.create({
      data: {
        organisationId: org.id,
        name: 'Werribee',
        addressStreet: '12 Hoppers Lane',
        addressCity: 'Werribee',
        addressState: 'VIC',
        addressPostcode: '3030',
      },
    });

    // ── Staff ────────────────────────────────────────────────────────────────
    const sarah = await tx.staff.create({
      data: {
        organisationId: org.id,
        firstName: 'Sarah',
        lastName: 'Mitchell',
        email: 'sarah.mitchell@rocketacademy.edu.au',
        role: 'ADMIN',
      },
    });

    const jake = await tx.staff.create({
      data: {
        organisationId: org.id,
        firstName: 'Jake',
        lastName: 'Scott',
        email: 'jake.scott@rocketacademy.edu.au',
        role: 'LEAD_INSTRUCTOR',
      },
    });

    const emma = await tx.staff.create({
      data: {
        organisationId: org.id,
        firstName: 'Emma',
        lastName: 'Chen',
        email: 'emma.chen@rocketacademy.edu.au',
        role: 'LEAD_INSTRUCTOR',
      },
    });

    // ── CampusStaff ─────────────────────────────────────────────────────────
    await tx.campusStaff.createMany({
      data: [
        { campusId: campus.id, staffId: sarah.id },
        { campusId: campus.id, staffId: jake.id },
        { campusId: campus.id, staffId: emma.id },
      ],
    });

    // ── Programs ─────────────────────────────────────────────────────────────
    const juniorEngineers = await tx.program.create({
      data: {
        organisationId: org.id,
        name: 'Junior Engineers',
        description: 'Introduction to programming through hands-on engineering projects',
      },
    });

    const masterBuilder = await tx.program.create({
      data: {
        organisationId: org.id,
        name: 'Master Builder Prime',
        description: 'Advanced construction and computational thinking for experienced builders',
      },
    });

    // ── Cohorts ──────────────────────────────────────────────────────────────
    const cohort1 = await tx.cohort.create({
      data: {
        programId: juniorEngineers.id,
        campusId: campus.id,
        name: 'Junior Engineers — Term 1 2026',
        status: 'ACTIVE',
        room: 'Room A',
        maxCapacity: 8,
      },
    });

    const cohort2 = await tx.cohort.create({
      data: {
        programId: masterBuilder.id,
        campusId: campus.id,
        name: 'Master Builder Prime — Term 2 2026',
        status: 'UPCOMING',
        room: 'Room B',
        maxCapacity: 8,
      },
    });

    // ── Sessions ─────────────────────────────────────────────────────────────
    // All sessions 75 minutes (matching iClassPro 4500-second durations)
    // AEDT is UTC+11 in February; UTC+11 in March
    const session1 = await tx.session.create({
      data: {
        cohortId: cohort1.id,
        leadInstructorId: jake.id,
        scheduledAt: new Date('2026-02-11T05:00:00.000Z'), // Wed 4:00 PM AEDT — past
        durationMinutes: 75,
        status: 'COMPLETED',
      },
    });

    const session2 = await tx.session.create({
      data: {
        cohortId: cohort1.id,
        leadInstructorId: jake.id,
        scheduledAt: new Date('2026-02-18T05:00:00.000Z'), // Wed 4:00 PM AEDT — today
        durationMinutes: 75,
        status: 'COMPLETED',
      },
    });

    // Sessions 3 & 4 are future/UPCOMING — no attendance records seeded
    await tx.session.create({
      data: {
        cohortId: cohort2.id,
        leadInstructorId: emma.id,
        scheduledAt: new Date('2026-02-25T06:00:00.000Z'), // Wed 5:00 PM AEDT — future
        durationMinutes: 75,
        status: 'SCHEDULED',
      },
    });

    await tx.session.create({
      data: {
        cohortId: cohort2.id,
        leadInstructorId: emma.id,
        scheduledAt: new Date('2026-03-04T06:00:00.000Z'), // Wed 5:00 PM AEDT — future
        durationMinutes: 75,
        status: 'SCHEDULED',
      },
    });

    // ── Families & Students ──────────────────────────────────────────────────
    const cohort1Students = [];
    for (const { family: familyData, student: studentData } of cohort1Data) {
      const family = await tx.family.create({ data: { ...familyData } });
      const student = await tx.student.create({ data: { familyId: family.id, ...studentData } });
      cohort1Students.push(student);
    }

    const cohort2Students = [];
    for (const { family: familyData, student: studentData } of cohort2Data) {
      const family = await tx.family.create({ data: { ...familyData } });
      const student = await tx.student.create({ data: { familyId: family.id, ...studentData } });
      cohort2Students.push(student);
    }

    // ── Enrolments ───────────────────────────────────────────────────────────
    for (const student of cohort1Students) {
      await tx.enrolment.create({
        data: { studentId: student.id, cohortId: cohort1.id, status: 'ACTIVE', startDate: new Date('2026-02-04') },
      });
    }

    for (const student of cohort2Students) {
      await tx.enrolment.create({
        data: { studentId: student.id, cohortId: cohort2.id, status: 'ACTIVE', startDate: new Date('2026-04-07') },
      });
    }

    // ── Attendance ───────────────────────────────────────────────────────────
    // Session 1 (past, COMPLETED): 4 PRESENT, 1 ABSENT, 1 LATE
    const session1Statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE'];
    for (let i = 0; i < cohort1Students.length; i++) {
      await tx.attendance.create({
        data: { sessionId: session1.id, studentId: cohort1Students[i].id, status: session1Statuses[i] },
      });
    }

    // Session 2 (today, COMPLETED): all students PRESENT for demo/UI testing
    for (const student of cohort1Students) {
      await tx.attendance.create({
        data: { sessionId: session2.id, studentId: student.id, status: 'PRESENT' },
      });
    }
  });

  console.log('Seed complete:');
  console.log('  1 organisation, 1 campus, 3 staff');
  console.log('  2 programs, 2 cohorts, 4 sessions');
  console.log('  12 families, 12 students, 12 enrolments');
  console.log('  12 attendance records (sessions 1 & 2 only)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
