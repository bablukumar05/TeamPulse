const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['Free', 'Pro', 'Enterprise'], default: 'Free' },
  settings: {
    allowPublicJoin: { type: Boolean, default: false },
    requireApproval:  { type: Boolean, default: true },
    defaultRole:      { type: String, default: 'Employee' },
    timezone:         { type: String, default: 'Asia/Kolkata' },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-generate slug from name
workspaceSchema.pre('validate', function(next) {
  if (this.isNew && !this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Workspace', workspaceSchema);
