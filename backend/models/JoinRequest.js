const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  skills: {
    type: [String],
    default: []
  },
  tenthMarks: {
    type: Number
  },
  twelfthMarks: {
    type: Number
  },
  graduationDegree: {
    type: String
  },
  postGraduationDegree: {
    type: String
  },
  resumeUrl: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
