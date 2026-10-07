const mongoose = require('mongoose');
const STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const CATEGORIES = ['Building', 'Electrical', 'Water & Sanitation', 'Furniture', 'Roads & Grounds', 'IT & Network', 'Other'];
const schema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120 },
  type: { type: String, enum: ['Damage', 'Requirement'], required: true },
  category: { type: String, enum: CATEGORIES, required: true },
  location: { type: String, required: true, maxlength: 160 },
  description: { type: String, required: true, maxlength: 3000 },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: STATUSES, default: 'Submitted' },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hasPhoto: { type: Boolean, default: false },
  photo: { type: Buffer, select: false },
  photoMime: { type: String, select: false },
  updates: [{ status: { type: String, enum: STATUSES }, note: String,
    author: { type: String, required: true }, at: { type: Date, default: Date.now } }]
}, { timestamps: true });
schema.index({ reporter: 1, createdAt: -1 });
schema.index({ status: 1, createdAt: -1 });
module.exports = { Report: mongoose.model('Report', schema), STATUSES, CATEGORIES };
