const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');
const Task = require('./models/Task');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/employee-management';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany();
    await Task.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);

    // Create Admin
    const admin = new User({
      firstName: 'Bablu Kumar',
      email: 'admin@me.com',
      password: hashedPassword,
      role: 'Admin'
    });
    await admin.save();

    // Create 150 Employees
    const firstNames = ["Aarav", "Aditya", "Akshay", "Ananya", "Anika", "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Neha", "Rohan", "Pooja", "Karan", "Simran"];
    
    for (let i = 0; i < 150; i++) {
        const randomName = firstNames[i % firstNames.length] + " " + Math.floor(Math.random() * 1000);
        const emp = new User({
            firstName: randomName,
            email: `employee${i+1}@example.com`,
            password: hashedPassword,
            role: 'Employee'
        });
        await emp.save();
        
        // Add sample tasks for each employee
        const task1 = new Task({
            title: `Task 1 for ${emp.firstName}`,
            description: `Complete the initial setup and design.`,
            date: `2025-07-15`,
            category: 'Development',
            status: 'New',
            assignedTo: emp._id
        });
        
        const task2 = new Task({
            title: `Task 2 for ${emp.firstName}`,
            description: `Review the PRs and merge to main.`,
            date: `2025-07-16`,
            category: 'Code Review',
            status: 'Active',
            assignedTo: emp._id
        });

        await task1.save();
        await task2.save();
    }

    console.log('Database seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding database', error);
    process.exit(1);
  }
};

seedDatabase();
