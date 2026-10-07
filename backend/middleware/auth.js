const { createHash, randomBytes } = require('node:crypto');
const Session = require('../models/Session');
const COOKIE = 'campusfix_session';
const options = () => ({ httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
const tokenHash = token => createHash('sha256').update(token).digest('hex');
function getToken(req) {
  const raw = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  return raw ? raw.slice(COOKIE.length + 1) : '';
}
async function startSession(res, user) {
  const token = randomBytes(32).toString('hex');
  const maxAge = 8 * 60 * 60 * 1000;
  await Session.create({ tokenHash: tokenHash(token), user: user._id, expiresAt: new Date(Date.now() + maxAge) });
  res.cookie(COOKIE, token, { ...options(), maxAge });
}
async function endSession(req, res) {
  const token = getToken(req);
  if (token) await Session.deleteOne({ tokenHash: tokenHash(token) });
  res.clearCookie(COOKIE, options());
}
async function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ message: 'Please sign in.' });
  const session = await Session.findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } }).populate('user');
  if (!session?.user) return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  req.user = session.user; next();
}
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  next();
}
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}
module.exports = { requireAuth, requireAdmin, startSession, endSession, publicUser };
