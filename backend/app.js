const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const path = require('node:path');
const mongoose = require('mongoose');
const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:', 'blob:'], 'upgrade-insecure-requests': null } },
  strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false }));
app.use('/api', rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a minute.' } }));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
    // Browser fetch sends Origin. This blocks cross-site cookie-authenticated writes.
    if (req.get('Origin') !== (process.env.APP_ORIGIN || 'http://localhost:5000'))
      return res.status(403).json({ message: 'Request origin is not allowed. Open the configured APP_ORIGIN.' });
    if (!req.is('application/json')) return res.status(415).json({ message: 'Send JSON data.' });
  }
  next();
});
app.use(express.json({ limit: '3mb' }));
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)))
    return res.status(400).json({ message: 'Send a JSON object.' });
  next();
});
app.get('/api/health', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503)
  .json({ message: mongoose.connection.readyState === 1 ? 'API and MongoDB connected.' : 'MongoDB disconnected.' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use((req, res) => res.status(404).send('Page not found. Open / for CampusFix.'));
app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ message: 'This email is already registered.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request too large. Use a photo smaller than 2 MB.' });
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ message: 'Invalid JSON.' });
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
  if (status >= 500) console.error(error.message);
  res.status(status).json({ message: status >= 500 ? 'Server error. Check the server terminal.' : error.message });
});
module.exports = app;
