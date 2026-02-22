const express = require('express');
const router = express.Router();
const prisma = require('../db');

// ── POST /api/v1/parent/pending-registration ──────────────────────────────────
// No auth required — this is the fallback for parents whose email isn't in the DB.
// Stores their details so an admin can manually link them to a Family record.
router.post('/parent/pending-registration', async (req, res, next) => {
  try {
    const { email, phone, childName, partnerName, locationEnrolled } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const record = await prisma.pendingRegistration.create({
      data: { email, phone, childName, partnerName, locationEnrolled },
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
