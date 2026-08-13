const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'task_assigned', 'task_due_tomorrow', 'task_overdue',
      'task_status_changed', 'task_commented', 'task_mentioned',
      'task_completed', 'checklist_completed',
      'sprint_started', 'sprint_completed',
      'milestone_reached',
      'leave_submitted', 'leave_approved', 'leave_denied',
      'project_created', 'project_member_added',
      'announcement', 'kudo_received',
      'dm_received', 'group_message', 'mention_in_chat',
      'join_request_approved', 'system'
    ],
    required: true
  },
  title:    { type: String, required: true },
  body:     { type: String, default: '' },
  link:     { type: String, default: '' },   // frontend deeplink
  isRead:   { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
