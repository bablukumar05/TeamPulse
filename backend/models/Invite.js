const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Employee'],
    required: true
  },
  department: {
    type: String,
    default: 'General'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  email: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Invite', inviteSchema);
