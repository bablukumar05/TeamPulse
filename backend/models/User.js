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
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Suspended', 'Deleted'],
    default: 'Approved' // defaults to Approved for backward compatibility
  },
  department: {
    type: String,
    default: 'General'
  },
  baseSalaryLPA: {
    type: Number,
    default: 0
  },
  employmentStatus: {
    type: String,
    enum: ['Active', 'Terminated'],
    default: 'Active'
  },
  inviteCodeUsed: String,
  isApproved: {
    type: Boolean,
    default: true
  },

  // ── Phase 1 Enterprise Profile Fields ─────────────────────────
  lastName:    { type: String, default: '' },
  employeeId:  { type: String, unique: true, sparse: true }, // auto-gen: EMP-XXXX
  phone:       { type: String, default: '' },
  bio:         { type: String, default: '' },
  dateOfBirth: { type: Date },
  joinDate:    { type: Date },
  timezone:    { type: String, default: 'Asia/Kolkata' },

  // Org hierarchy
  workspace:    { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  teamId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  managerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Professional
  skills:     [String],
  experience: [{
    title:   String,
    company: String,
    years:   Number,
    _id: false
  }],

  // HR Documents
  documents: [{
    name:       String,
    url:        String,
    type:       { type: String, default: 'Document' },
    uploadedAt: { type: Date, default: Date.now },
    _id: false
  }],

  // Presence
  lastSeen:  { type: Date },
  isOnline:  { type: Boolean, default: false },

  // Termination & Exit Records
  terminationReason:  { type: String, default: '' },
  terminationDetails: { type: String, default: '' },
  severanceNotice:    { type: String, default: '' },
  terminatedAt:       { type: Date },
  terminatedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });


userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
