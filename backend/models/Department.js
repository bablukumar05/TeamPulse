const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  color: { type: String, default: '#6366f1' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
