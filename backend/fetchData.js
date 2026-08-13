const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Task = require('./models/Task');
const Project = require('./models/Project');

const MONGO_URI = process.env.MONGO_URI;

const fetchData = async () => {
  try {
    console.log('Connecting to MongoDB Atlas…');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas Successfully!\n');

    // Fetch Total Counts
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    const projectCount = await Project.countDocuments();

    console.log('📊 DATABASE SUMMARY:');
    console.log(`- Total Users/Employees: ${userCount}`);
    console.log(`- Total Tasks: ${taskCount}`);
    console.log(`- Total Projects: ${projectCount}\n`);

    // Fetch Sample Admin Account
    const admin = await User.findOne({ role: 'Admin' }).select('firstName email role employmentStatus');
    console.log('👤 ADMIN ACCOUNT:');
    console.log(admin || 'No Admin found');

    // Fetch Top 5 Users
    console.log('\n👥 FIRST 5 EMPLOYEES:');
    const users = await User.find().select('firstName email role department').limit(5);
    console.table(users.map(u => ({ ID: u._id.toString(), Name: u.firstName, Email: u.email, Role: u.role, Dept: u.department || 'General' })));

    // Fetch Top 5 Tasks
    console.log('\n📋 FIRST 5 TASKS:');
    const tasks = await Task.find().select('title category status priority').limit(5);
    console.table(tasks.map(t => ({ Title: t.title, Category: t.category, Status: t.status, Priority: t.priority })));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching data from MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

fetchData();
