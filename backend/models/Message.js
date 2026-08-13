const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  url:      { type: String, required: true },
  filename: { type: String, required: true },
  size:     { type: Number, default: 0 },
  mimeType: { type: String, default: '' },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  // Legacy global chat fields (kept for backward compat)
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  text:       { type: String, required: true },

  // ── Phase 1 Multi-Room Chat Fields ──────────────────────────
  room:          { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  attachments:   [attachmentSchema],
  reactions:     [reactionSchema],
  mentions:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

messageSchema.index({ room: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
