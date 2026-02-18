const express = require('express');
const router = express.Router();
const prisma = require('../db');

router.get('/sessions/:id', async (req, res, next) => {
  try {
    res.json({});
  } catch (err) {
    next(err);
  }
});

router.put('/sessions/:id/attendance', async (req, res, next) => {
  try {
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
