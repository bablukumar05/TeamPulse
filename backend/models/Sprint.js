const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  project:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name:      { type: String, required: true, trim: true },
  goal:      { type: String, default: '' },
  startDate: { type: Date },
  endDate:   { type: Date },
  status: {
    type: String,
    enum: ['Planning', 'Active', 'Completed'],
    default: 'Planning'
  },
  velocity:       { type: Number, default: 0 },  // story points completed
  totalPoints:    { type: Number, default: 0 },  // total story points planned
  completedAt:    { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Sprint', sprintSchema);
