/**
 * Integration tests for Family model.
 *
 * Verifies that:
 * 1. A family can be created without a campusId (no direct campus FK).
 * 2. A family's campus affiliations are queryable through the enrolment
 *    relationship: family → students → enrolments → cohort → campus.
 *
 * These tests run against the real database. Requires DATABASE_URL to be set.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Unique prefix so parallel test runs don't collide
const RUN_ID = Date.now().toString();

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

    return { org, campus, family, student, cohort };
  });
}

async function deleteTestFixtures(ids) {
  await prisma.$transaction(async (tx) => {
    await tx.enrolment.deleteMany({ where: { studentId: ids.studentId } });
    await tx.student.deleteMany({ where: { id: ids.studentId } });
    await tx.family.deleteMany({ where: { id: ids.familyId } });
    await tx.cohort.deleteMany({ where: { id: ids.cohortId } });
    await tx.program.deleteMany({ where: { organisationId: ids.orgId } });
    await tx.campus.deleteMany({ where: { id: ids.campusId } });
    await tx.organisation.deleteMany({ where: { id: ids.orgId } });
  });
}

describe('Family — no direct campus FK', () => {
  let fixtures;

  beforeAll(async () => {
    fixtures = await createTestFixtures();
  });

  afterAll(async () => {
    await deleteTestFixtures({
      studentId: fixtures.student.id,
      familyId: fixtures.family.id,
      cohortId: fixtures.cohort.id,
      campusId: fixtures.campus.id,
      orgId: fixtures.org.id,
    });
    await prisma.$disconnect();
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

  it('enforces global uniqueness on primaryEmail', async () => {
    await expect(
      prisma.family.create({
        data: {
          name: 'Duplicate Family',
          primaryEmail: `test.${RUN_ID}@example.com`,
        },
      })
    ).rejects.toThrow();
  });
});
