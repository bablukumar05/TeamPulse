const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  startDate: { type: Date },
  endDate:   { type: Date },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Active', 'Completed', 'On Hold'],
    default: 'In Progress'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Phase 1 Enterprise Fields ──────────────────────────────
  workspace:  { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  team:       { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lead:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:       [String],
  color:      { type: String, default: '#6366f1' },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
