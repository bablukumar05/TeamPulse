const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['DM', 'Group', 'Project', 'Department', 'Announcement'],
    required: true
  },
  name:         { type: String, trim: true },   // null for DMs
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  project:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  department:   { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: {
    text:     { type: String, default: '' },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt:   { type: Date },
  },
  avatar:     { type: String, default: '' },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure DM rooms are unique per pair
chatRoomSchema.index({ type: 1, participants: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
