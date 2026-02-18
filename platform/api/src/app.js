const express = require('express');
const cors = require('cors');
const prisma = require('./db');
const instructorRoutes = require('./routes/instructor');
const sessionRoutes = require('./routes/sessions');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));

app.use(express.json());

app.use('/api/v1', instructorRoutes);
app.use('/api/v1', sessionRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
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
