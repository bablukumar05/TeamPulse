const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedByName: { type: String, required: true },
  details: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
