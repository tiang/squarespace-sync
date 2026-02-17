const express = require('express');
const prisma = require('./db');

const app = express();

app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      error: err.message,
    });
  }
});

module.exports = app;
