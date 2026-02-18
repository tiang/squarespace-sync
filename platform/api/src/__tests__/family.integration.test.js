/**
 * Integration tests for Family model.
 *
 * Verifies that:
 * 1. A family can be created without a campusId (no direct campus FK).
 * 2. A family's campus affiliations are queryable through the enrolment
 *    relationship: family → students → enrolments → cohort → campus.
 * 3. A family with no enrolments returns an empty campus list.
 *
 * These tests run against the real database. Requires DATABASE_URL to be set.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Combine timestamp + PID so parallel CI workers spawned in the same millisecond
// don't collide on the unique email constraint.
const RUN_ID = `${Date.now()}-${process.pid}`;

async function createTestFixtures() {
  return prisma.$transaction(async (tx) => {
    const org = await tx.organisation.create({
      data: { name: `Test Org ${RUN_ID}` },
    });

    const campus = await tx.campus.create({
      data: { organisationId: org.id, name: `Test Campus ${RUN_ID}` },
    });

    const program = await tx.program.create({
      data: { organisationId: org.id, name: `Test Program ${RUN_ID}` },
    });

    const cohort = await tx.cohort.create({
      data: {
        programId: program.id,
        campusId: campus.id,
        name: `Test Cohort ${RUN_ID}`,
        status: 'ACTIVE',
        maxCapacity: 8,
      },
    });

    // Family is created with NO campusId — this is the design under test
    const family = await tx.family.create({
      data: {
        name: `Test Family ${RUN_ID}`,
        primaryEmail: `test.${RUN_ID}@example.com`,
      },
    });

    // Separate family with no enrolments — for the zero-enrolment boundary test
    const familyNoEnrolments = await tx.family.create({
      data: {
        name: `Test Family No Enrolments ${RUN_ID}`,
        primaryEmail: `no-enrolments.${RUN_ID}@example.com`,
      },
    });

    const student = await tx.student.create({
      data: {
        familyId: family.id,
        firstName: 'Test',
        lastName: `Student ${RUN_ID}`,
        birthDate: new Date('2017-06-01'),
      },
    });

    await tx.enrolment.create({
      data: {
        studentId: student.id,
        cohortId: cohort.id,
        status: 'ACTIVE',
        startDate: new Date('2026-02-04'),
      },
    });

    return { org, campus, program, cohort, family, familyNoEnrolments, student };
  });
}

async function deleteTestFixtures(ids) {
  await prisma.$transaction(async (tx) => {
    await tx.enrolment.deleteMany({ where: { studentId: ids.studentId } });
    await tx.student.delete({ where: { id: ids.studentId } });
    await tx.family.delete({ where: { id: ids.familyId } });
    await tx.family.delete({ where: { id: ids.familyNoEnrolmentsId } });
    await tx.cohort.delete({ where: { id: ids.cohortId } });
    await tx.program.delete({ where: { id: ids.programId } });
    await tx.campus.delete({ where: { id: ids.campusId } });
    await tx.organisation.delete({ where: { id: ids.orgId } });
  });
}

describe('Family — no direct campus FK', () => {
  let fixtures;

  beforeAll(async () => {
    fixtures = await createTestFixtures();
  });

  afterAll(async () => {
    try {
      await deleteTestFixtures({
        studentId: fixtures.student.id,
        familyId: fixtures.family.id,
        familyNoEnrolmentsId: fixtures.familyNoEnrolments.id,
        cohortId: fixtures.cohort.id,
        programId: fixtures.program.id,
        campusId: fixtures.campus.id,
        orgId: fixtures.org.id,
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('creates a family without campusId', () => {
    expect(fixtures.family.id).toBeDefined();
    expect(fixtures.family.primaryEmail).toBe(`test.${RUN_ID}@example.com`);
    // campusId must not exist on the returned object
    expect(fixtures.family).not.toHaveProperty('campusId');
  });

  it('resolves campus via family → students → enrolments → cohort → campus', async () => {
    const result = await prisma.family.findUnique({
      where: { id: fixtures.family.id },
      include: {
        students: {
          include: {
            enrolments: {
              include: {
                cohort: {
                  include: { campus: true },
                },
              },
            },
          },
        },
      },
    });

    const campuses = result.students
      .flatMap((s) => s.enrolments)
      .map((e) => e.cohort.campus);

    expect(campuses).toHaveLength(1);
    expect(campuses[0].id).toBe(fixtures.campus.id);
    expect(campuses[0].name).toBe(`Test Campus ${RUN_ID}`);
  });

  it('returns empty campus list for a family with no enrolments', async () => {
    const result = await prisma.family.findUnique({
      where: { id: fixtures.familyNoEnrolments.id },
      include: {
        students: {
          include: {
            enrolments: {
              include: { cohort: { include: { campus: true } } },
            },
          },
        },
      },
    });

    const campuses = result.students
      .flatMap((s) => s.enrolments)
      .map((e) => e.cohort.campus);

    expect(campuses).toHaveLength(0);
  });

  it('enforces global uniqueness on primaryEmail', async () => {
    await expect(
      prisma.family.create({
        data: {
          name: 'Duplicate Family',
          primaryEmail: `test.${RUN_ID}@example.com`,
        },
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
