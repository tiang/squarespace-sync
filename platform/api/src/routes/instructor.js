const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Stub: hardcoded to Jake Scott from seed data
const STUB_INSTRUCTOR_EMAIL = 'jake.scott@rocketacademy.edu.au';

router.get('/instructor/sessions', async (req, res, next) => {
  try {
    res.json([]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
