const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const v = require('../validation');
const { hashPassword, verifyPassword } = require('../password');
const { requireAuth, startSession, endSession, publicUser } = require('../middleware/auth');
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Try again in 15 minutes.' } });
router.post('/register', limiter, async (req, res) => {
  const name = v.text(req.body.name, 'Name', 2, 80);
  const email = v.email(req.body.email);
  const passwordHash = await hashPassword(v.password(req.body.password));
  // Never accept a role from the browser. Only the local CLI creates admins.
  const user = await User.create({ name, email, passwordHash, role: 'student' });
  await endSession(req, res);
  await startSession(res, user);
  res.status(201).json({ user: publicUser(user) });
});
router.post('/login', limiter, async (req, res) => {
  const email = v.email(req.body.email);
  const password = v.password(req.body.password);
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !await verifyPassword(password, user.passwordHash)) v.fail('Incorrect email or password.', 401);
  await endSession(req, res);
  await startSession(res, user);
  res.json({ user: publicUser(user) });
});
router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
router.post('/logout', async (req, res) => { await endSession(req, res); res.json({ message: 'Signed out.' }); });
module.exports = router;
