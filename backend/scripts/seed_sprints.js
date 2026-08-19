const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const Sprint = require('./models/Sprint');
const Project = require('./models/Project');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kumarbablu74824_db_user:wMooohJWCuUW8Qko@cluster0.gffjvwp.mongodb.net/TeamPulse?retryWrites=true&w=majority&appName=Cluster0';

async function seedSprints() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    let adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
      adminUser = await User.findOne({});
    }

    let project = await Project.findOne({ name: 'TeamPulse Enterprise Platform' });
    if (!project) {
      project = await Project.create({
        name: 'TeamPulse Enterprise Platform',
        description: 'Core product engineering and sprint development workspace',
        startDate: new Date('2026-01-01'),
        status: 'In Progress',
        priority: 'High',
        members: adminUser ? [adminUser._id] : []
      });
    }

    const sprintConfigs = [
      { name: 'Sprint 1: System Architecture Setup', goal: 'Core MERN structure and authentication', velocity: 22, totalPoints: 25, offsetDays: 140 },
      { name: 'Sprint 2: Database Schemas & Models', goal: 'MongoDB schemas for Users and Tasks', velocity: 28, totalPoints: 30, offsetDays: 133 },
      { name: 'Sprint 3: User Auth & JWT Security', goal: 'Login, Register, and Token interceptors', velocity: 32, totalPoints: 35, offsetDays: 126 },
      { name: 'Sprint 4: Role-Based Access Control', goal: 'Admin and Manager permission levels', velocity: 30, totalPoints: 32, offsetDays: 119 },
      { name: 'Sprint 5: Core Task Kanban Board', goal: 'Drag and drop task cards engine', velocity: 40, totalPoints: 42, offsetDays: 112 },
      { name: 'Sprint 6: Real-time Socket.IO Chat', goal: 'Global and project chat rooms', velocity: 38, totalPoints: 40, offsetDays: 105 },
      { name: 'Sprint 7: Department Workspace Grid', goal: '8 IT departments categorization', velocity: 35, totalPoints: 38, offsetDays: 98 },
      { name: 'Sprint 8: Attendance & Time Logs', goal: 'Check-in, check-out, and break timers', velocity: 45, totalPoints: 48, offsetDays: 91 },
      { name: 'Sprint 9: HR Operations & Leave Module', goal: 'Leave request approval workflows', velocity: 42, totalPoints: 45, offsetDays: 84 },
      { name: 'Sprint 10: Performance Reviews Engine', goal: 'Quarterly review rating forms', velocity: 50, totalPoints: 52, offsetDays: 77 },
      { name: 'Sprint 11: Document Vault & Uploads', goal: 'Multer static uploads for HR docs', velocity: 36, totalPoints: 40, offsetDays: 70 },
      { name: 'Sprint 12: Notification Center & Badges', goal: 'Real-time alert notifications', velocity: 48, totalPoints: 50, offsetDays: 63 },
      { name: 'Sprint 13: Recharts Dashboard Analytics', goal: 'Visual productivity trend charts', velocity: 55, totalPoints: 58, offsetDays: 56 },
      { name: 'Sprint 14: PDF & Excel Exporters', goal: 'Automated report file exports', velocity: 52, totalPoints: 55, offsetDays: 49 },
      { name: 'Sprint 15: AI Assistant Drawer Integration', goal: 'OpenAI intelligent helper', velocity: 60, totalPoints: 62, offsetDays: 42 },
      { name: 'Sprint 16: Security Audit & Rate Limiting', goal: 'Helmet, MongoSanitize, RateLimiters', velocity: 58, totalPoints: 60, offsetDays: 35 },
      { name: 'Sprint 17: Express 5 Route Migration', goal: 'Upgrade route matchers to path-to-regexp v8', velocity: 65, totalPoints: 68, offsetDays: 28 },
      { name: 'Sprint 18: Responsive Layout Polish', goal: 'Mobile, Tablet, and Desktop responsive grid', velocity: 62, totalPoints: 65, offsetDays: 21 },
      { name: 'Sprint 19: Morgan & Console Logger Refactor', goal: 'Clean HTTP logging and error handling', velocity: 70, totalPoints: 72, offsetDays: 14 },
      { name: 'Sprint 20: Render Anti-Sleep & Connection Pooling', goal: 'Fast 200ms API response times', velocity: 75, totalPoints: 78, offsetDays: 7 },
      { name: 'Sprint 21: Enterprise Velocity Benchmarking', goal: 'Sprint velocity analytics data feed', velocity: 78, totalPoints: 80, offsetDays: 3 },
      { name: 'Sprint 22: Live Production Launch', goal: 'Final deployment and user acceptance', velocity: 85, totalPoints: 85, offsetDays: 0 }
    ];

    console.log(`Seeding ${sprintConfigs.length} Sprints...`);

    for (const item of sprintConfigs) {
      const startDate = new Date(Date.now() - item.offsetDays * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      await Sprint.findOneAndUpdate(
        { name: item.name, project: project._id },
        {
          project: project._id,
          name: item.name,
          goal: item.goal,
          startDate,
          endDate,
          status: 'Completed',
          velocity: item.velocity,
          totalPoints: item.totalPoints,
          completedAt: endDate,
          createdBy: adminUser ? adminUser._id : null
        },
        { upsert: true, new: true }
      );
    }

    console.log('Successfully seeded 22 Sprints into MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedSprints();
