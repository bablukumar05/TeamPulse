const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: false,
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  category: {
    type: String,
    default: 'General',
  },
  labels: [{
    type: String,
  }],
  status: {
    type: String,
    enum: [
      'Backlog',
      'To Do',
      'In Progress',
      'Code Review',
      'Testing / QA',
      'Ready for Deployment',
      'Completed',
      'Blocked',
      'Archived',
      'New',
      'Active',
      'Failed'
    ],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  department: {
    type: String,
  },
  checklist: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userAvatar: String,
    text: String,
    date: { type: Date, default: Date.now }
  }],
  attachments: [{
    url: String,
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  activityLog: [{
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // ── Phase 1 Enterprise Fields ──────────────────────────────
  sprint:      { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  milestone:   { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
  parentTask:  { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  subtasks:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  storyPoints: { type: Number, default: 0 },
  position:    { type: Number, default: 0 },
  watchers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mentions:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, { timestamps: true });

// ── Performance Indexes ────────────────────────────────────
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ project: 1, sprint: 1 });
taskSchema.index({ milestone: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
