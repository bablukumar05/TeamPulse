const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, default: 'Enterprise' },
  seats: { type: Number, default: 1000 },
  subscriptionStatus: { type: String, default: 'Active' },
  currency: { type: String, enum: ['USD', 'INR', 'EUR'], default: 'USD' },
  invoices: [
    {
      invoiceNumber: { type: String, required: true },
      amount: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
      date: { type: Date, default: Date.now },
      plan: { type: String, required: true },
      seats: { type: Number, default: 50 }
    }
  ],
  security: {
    enforce2FA: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 120 },
    allowPublicJoin: { type: Boolean, default: false },
    requireAdminApproval: { type: Boolean, default: true }
  },
  integrations: {
    github: {
      enabled: { type: Boolean, default: false },
      webhookSecret: { type: String, default: '' },
      autoTransitionOnCommit: { type: Boolean, default: true },
      autoCloseOnPRMerge: { type: Boolean, default: true },
      defaultBranch: { type: String, default: 'main' }
    },
    gitlab: {
      enabled: { type: Boolean, default: false },
      webhookSecret: { type: String, default: '' },
      autoTransition: { type: Boolean, default: true }
    },
    slack: {
      enabled: { type: Boolean, default: false },
      webhookUrl: { type: String, default: '' },
      channel: { type: String, default: '#general' },
      notifyOnTaskAssign: { type: Boolean, default: true },
      notifyOnReviewSubmit: { type: Boolean, default: true },
      dailySprintDigest: { type: Boolean, default: true }
    },
    calendar: {
      enabled: { type: Boolean, default: true },
      feedToken: { type: String, default: () => require('crypto').randomBytes(16).toString('hex') },
      includeLeaves: { type: Boolean, default: true },
      includeMilestones: { type: Boolean, default: true },
      includeDeadlines: { type: Boolean, default: true }
    }
  },
  settings: {
    allowPublicJoin: { type: Boolean, default: false },
    requireApproval:  { type: Boolean, default: true },
    defaultRole:      { type: String, default: 'Employee' },
    timezone:         { type: String, default: 'Asia/Kolkata' },
    workingHours:     { type: String, default: '09:00 - 18:00' }
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

workspaceSchema.pre('validate', function() {
  if (this.isNew && !this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
});

module.exports = mongoose.model('Workspace', workspaceSchema);

