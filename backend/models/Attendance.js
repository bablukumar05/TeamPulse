const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
  startTime:       { type: Date, required: true },
  endTime:         { type: Date },
  durationMinutes: { type: Number, default: 0 },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:        { type: Date, required: true },
  checkInTime: { type: Date },
  checkOutTime:{ type: Date },
  breaks:      [breakSchema],
  totalWorkMinutes:  { type: Number, default: 0 },
  totalBreakMinutes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-Day', 'WFH', 'Holiday', 'On Leave'],
    default: 'Absent'
  },
  isLate:     { type: Boolean, default: false },
  isOvertime: { type: Boolean, default: false },
  notes:      { type: String, default: '' },
  location:   { type: String, default: '' },
}, { timestamps: true });

// One record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
