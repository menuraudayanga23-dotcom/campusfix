const router = require('express').Router();
const mongoose = require('mongoose');
const { Report, STATUSES, CATEGORIES } = require('../models/Report');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const v = require('../validation');
router.use(requireAuth);
router.get('/meta', (req, res) => res.json({ statuses: STATUSES, categories: CATEGORIES }));
function scope(req) { return req.user.role === 'admin' ? {} : { reporter: req.user._id }; }
async function findReport(req, photo = false) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) v.fail('Invalid report ID.');
  let query = Report.findOne({ _id: req.params.id, ...scope(req) });
  if (photo) query = query.select('+photo +photoMime');
  const report = await query.populate('reporter', 'name email');
  if (!report) v.fail('Report not found.', 404);
  return report;
}
router.get('/stats', async (req, res) => {
  const grouped = await Report.aggregate([{ $match: scope(req) }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(STATUSES.map(s => [s, 0]));
  for (const row of grouped) counts[row._id] = row.count;
  res.json({ counts, total: Object.values(counts).reduce((a,b) => a+b, 0) });
});
router.get('/', async (req, res) => {
  const filter = scope(req);
  if (req.query.status) filter.status = v.choice(req.query.status, STATUSES, 'status');
  if (req.query.category) filter.category = v.choice(req.query.category, CATEGORIES, 'category');
  if (req.query.q) {
    const q = v.text(req.query.q, 'Search', 1, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = ['title','location','description'].map(key => ({ [key]: { $regex: q, $options: 'i' } }));
  }
  const page = Number(req.query.page || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) v.fail('Invalid page.');
  const limit = 10;
  const [reports, total] = await Promise.all([
    Report.find(filter).select('-updates').populate('reporter','name email').sort({ createdAt: -1, _id: -1 }).skip((page-1)*limit).limit(limit),
    Report.countDocuments(filter)
  ]);
  res.json({ reports, total, page, pages: Math.max(1, Math.ceil(total/limit)) });
});
router.post('/', async (req, res) => {
  const body = req.body;
  const fields = {
    title: v.text(body.title, 'Title', 5, 120),
    type: v.choice(body.type, ['Damage','Requirement'], 'report type'),
    category: v.choice(body.category, CATEGORIES, 'category'),
    location: v.text(body.location, 'Location', 3, 160),
    description: v.text(body.description, 'Description', 10, 3000),
    priority: v.choice(body.priority, ['Low','Medium','High'], 'priority'),
    reporter: req.user._id,
    updates: [{ status: 'Submitted', note: 'Report submitted.', author: req.user.name }]
  };
  const image = v.photo(body.photo);
  if (image) Object.assign(fields, { hasPhoto: true, photo: image.buffer, photoMime: image.mime });
  const created = await Report.create(fields);
  const report = await Report.findById(created._id).populate('reporter','name email');
  res.status(201).json({ report });
});
router.get('/:id/photo', async (req, res) => {
  const report = await findReport(req, true);
  if (!report.photo) v.fail('Photo not found.', 404);
  res.set('Content-Type', report.photoMime).set('Cache-Control','no-store').send(report.photo);
});
router.get('/:id', async (req, res) => res.json({ report: await findReport(req) }));
router.patch('/:id/status', requireAdmin, async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) v.fail('Invalid report ID.');
  const status = v.choice(req.body.status, STATUSES, 'status');
  const note = v.text(req.body.note, 'Update note', 3, 1000);
  // Atomic append avoids lost timeline entries when two admins update together.
  const report = await Report.findByIdAndUpdate(req.params.id,
    { $set: { status }, $push: { updates: { status, note, author: req.user.name, at: new Date() } } },
    { new: true, runValidators: true }).populate('reporter','name email');
  if (!report) v.fail('Report not found.', 404);
  res.json({ report });
});
module.exports = router;
