const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  workspace:  { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  color: { type: String, default: '#0ea5e9' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
