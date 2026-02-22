const express = require('express');
const cors = require('cors');
const prisma = require('./db');
const instructorRoutes = require('./routes/instructor');
const sessionRoutes = require('./routes/sessions');
const parentRoutes = require('./routes/parent');
const staffRoutes = require('./routes/staff');
const pendingRegistrationRoutes = require('./routes/pendingRegistration');

const app = express();

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
}));

app.use(express.json());

app.use('/api/v1', instructorRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1', parentRoutes);
app.use('/api/v1', staffRoutes);
app.use('/api/v1', pendingRegistrationRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

module.exports = app;
