/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RoadRescue AI — Backend Server
 *  Port: 5000
 * ═══════════════════════════════════════════════════════════════════════════
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

// Connect Database
connectDB();

// ── Import all routes from single api.js ──────────────────────────────────
const {
  authRouter,
  requestRouter,
  feedbackRouter,
  chatRouter,
  notifRouter,
  profileRouter,
  earningsRouter,
  adminRouter,
} = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Mount Routes ──────────────────────────────────────────────────────────
app.use('/api/auth',          authRouter);
app.use('/api/requests',      requestRouter);
app.use('/api/feedback',      feedbackRouter);
app.use('/api/chat',          chatRouter);
app.use('/api/notifications', notifRouter);
app.use('/api/profile',       profileRouter);
app.use('/api/earnings',      earningsRouter);
app.use('/api/admin',         adminRouter);

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({
    status:  '✅ Running',
    service: 'RoadRescue AI Backend',
    version: '2.0.0',
    routes: [
      '/api/auth',
      '/api/requests',
      '/api/feedback',
      '/api/chat',
      '/api/notifications',
      '/api/profile',
      '/api/earnings',
      '/api/admin',
    ],
  })
);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

// ── Error Handler ─────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚗 RoadRescue AI Backend  →  http://localhost:${PORT}`);
    console.log('📁 Structure: backend/server.js → routes/api.js → data/*.json\n');
  });
}

module.exports = app;
