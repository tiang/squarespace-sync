/**
 * Integration tests for parent portal API routes.
 *
 * Tests verify:
 * 1. GET /parent/stub returns family with students and enrolments.
 * 2. GET /parent/stub/students/:id/attendance returns records (empty if no seed data).
 * 3. GET /parent/stub/invoices returns empty array (billing not yet modelled).
 * 4. GET /parent/stub/messages returns empty array (messaging not yet built).
 * 5. PATCH /parent/stub updates contact fields without touching email.
 * 6. PATCH /parent/stub ignores unknown fields (does not throw).
 *
 * Requires DATABASE_URL to be set and seed data to be present.
 */

const request = require('supertest');
const app = require('../app');

const STUB_EMAIL = 'nguyen.family@gmail.com';

describe('Parent portal stub routes', () => {
  describe('GET /api/v1/parent/stub', () => {
    it('returns 200 with family name and students array', async () => {
      const res = await request(app).get('/api/v1/parent/stub');
      expect(res.status).toBe(200);
      expect(res.body.primaryEmail).toBe(STUB_EMAIL);
      expect(Array.isArray(res.body.students)).toBe(true);
    });

    it('includes cohort and campus on each enrolment', async () => {
      const res = await request(app).get('/api/v1/parent/stub');
      expect(res.status).toBe(200);
      const enrolments = res.body.students.flatMap(s => s.enrolments);
      // Nguyen family has one active student with one enrolment
      expect(enrolments.length).toBeGreaterThanOrEqual(1);
      expect(enrolments[0].cohort.program.name).toBeDefined();
      expect(enrolments[0].cohort.campus.name).toBeDefined();
    });
  });

  describe('GET /api/v1/parent/stub/students/:studentId/attendance', () => {
    let studentId;

    beforeAll(async () => {
      const res = await request(app).get('/api/v1/parent/stub');
      studentId = res.body.students[0].id;
    });

    it('returns 200 with an array (may be empty if no attendance recorded)', async () => {
      const res = await request(app).get(`/api/v1/parent/stub/students/${studentId}/attendance`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 404 for a student not belonging to the stub family', async () => {
      const res = await request(app).get('/api/v1/parent/stub/students/non-existent-id/attendance');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/parent/stub/invoices', () => {
    it('returns 200 with an empty array (billing not yet modelled)', async () => {
      const res = await request(app).get('/api/v1/parent/stub/invoices');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/v1/parent/stub/messages', () => {
    it('returns 200 with an empty array (messaging not yet built)', async () => {
      const res = await request(app).get('/api/v1/parent/stub/messages');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('PATCH /api/v1/parent/stub', () => {
    const originalPhone = '0412345678';

    afterEach(async () => {
      // Restore original phone after each test
      await request(app).patch('/api/v1/parent/stub').send({ primaryPhone: originalPhone });
    });

    it('updates primaryPhone and returns the updated family', async () => {
      const res = await request(app)
        .patch('/api/v1/parent/stub')
        .send({ primaryPhone: '0499999999' });

      expect(res.status).toBe(200);
      expect(res.body.primaryPhone).toBe('0499999999');
    });

    it('does not update primaryEmail (field is not whitelisted)', async () => {
      const res = await request(app)
        .patch('/api/v1/parent/stub')
        .send({ primaryEmail: 'hacker@evil.com' });

      expect(res.status).toBe(200);
      expect(res.body.primaryEmail).toBe(STUB_EMAIL);
    });

    it('ignores unknown fields without throwing', async () => {
      const res = await request(app)
        .patch('/api/v1/parent/stub')
        .send({ unknownField: 'value' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/parent/stub/sessions', () => {
    it('returns 200 with an array', async () => {
      const res = await request(app).get('/api/v1/parent/stub/sessions');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('each session has required fields', async () => {
      const res = await request(app).get('/api/v1/parent/stub/sessions');
      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        const s = res.body[0];
        expect(s.id).toBeDefined();
        expect(s.scheduledAt).toBeDefined();
        expect(typeof s.durationMinutes).toBe('number');
        expect(['SCHEDULED', 'CANCELLED']).toContain(s.status);
        expect(s.cohortName).toBeDefined();
        expect(s.campusName).toBeDefined();
        expect(Array.isArray(s.students)).toBe(true);
      }
    });

    it('returns only sessions scheduledAt >= today', async () => {
      const res = await request(app).get('/api/v1/parent/stub/sessions');
      expect(res.status).toBe(200);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (const s of res.body) {
        expect(new Date(s.scheduledAt).getTime()).toBeGreaterThanOrEqual(today.getTime());
      }
    });

    it('sessions are ordered by scheduledAt ascending', async () => {
      const res = await request(app).get('/api/v1/parent/stub/sessions');
      expect(res.status).toBe(200);
      for (let i = 1; i < res.body.length; i++) {
        expect(new Date(res.body[i].scheduledAt).getTime())
          .toBeGreaterThanOrEqual(new Date(res.body[i - 1].scheduledAt).getTime());
      }
    });
  });
});

describe('POST /api/v1/parent/pending-registration', () => {
  it('returns 201 and stores the submission', async () => {
    const payload = {
      email:           'new.parent@example.com',
      phone:           '0400 000 000',
      childName:       'Emma',
      partnerName:     'James',
      locationEnrolled: 'Brisbane',
    };
    const res = await request(app)
      .post('/api/v1/parent/pending-registration')
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe(payload.email);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/parent/pending-registration')
      .send({ phone: '0400 000 000' });
    expect(res.status).toBe(400);
  });
});
