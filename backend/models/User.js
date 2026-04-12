const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Employee'],
    default: 'Employee'
  },
  team: {
    type: String,
    default: 'General'
  },
  avatar: {
    type: String,
    default: ''
  },
  xp: {
    type: Number,
    default: 0
  },
  badges: {
    type: [String],
    default: ['Rookie']
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isApproved: {
    type: Boolean,
    default: true // defaults to true for existing admins, we will set false explicitly on Registration
  },
  inviteCodeUsed: String
}, { timestamps: true });

userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
