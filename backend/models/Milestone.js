const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dueDate:     { type: Date },
  status:      { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  color:       { type: String, default: '#f59e0b' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Milestone', milestoneSchema);
