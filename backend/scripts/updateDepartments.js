const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Department = require('./models/Department');

const MONGO_URI = process.env.MONGO_URI;

const IT_DEPARTMENTS = [
  {
    name: 'Frontend Engineering',
    description: 'React, Vue, Web Performance & Modern UI Component Architecture',
    color: '#3b82f6',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Web Vitals']
  },
  {
    name: 'Backend Engineering',
    description: 'Node.js, Express, Microservices, MongoDB & Distributed Systems',
    color: '#10b981',
    skills: ['Node.js', 'Express', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs']
  },
  {
    name: 'DevOps & Cloud Infrastructure',
    description: 'AWS, Kubernetes, Docker, CI/CD Pipelines & Terraform',
    color: '#8b5cf6',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux']
  },
  {
    name: 'Quality Assurance & QA',
    description: 'Automated Testing, Cypress, Jest, E2E Testing & Performance QA',
    color: '#f59e0b',
    skills: ['Cypress', 'Jest', 'Postman', 'Selenium', 'Automation Testing']
  },
  {
    name: 'Data Science & AI/ML',
    description: 'Python, Machine Learning, Data Engineering & OpenAI RAG Integrations',
    color: '#ec4899',
    skills: ['Python', 'PyTorch', 'SQL', 'Data Analytics', 'Machine Learning']
  },
  {
    name: 'Product & UI/UX Design',
    description: 'Figma, Product Management, Agile Sprints & User Research',
    color: '#06b6d4',
    skills: ['Figma', 'UI/UX Design', 'Agile/Scrum', 'User Research', 'Wireframing']
  },
  {
    name: 'Cyber Security & Compliance',
    description: 'Penetration Testing, InfoSec, Security Audits & OAuth JWT Security',
    color: '#ef4444',
    skills: ['CyberSecurity', 'Penetration Testing', 'JWT/OAuth', 'InfoSec', 'OWASP']
  },
  {
    name: 'Human Resources (HR)',
    description: 'Talent Acquisition, Employee Onboarding, Performance & Payroll Ops',
    color: '#6366f1',
    skills: ['HR Operations', 'Talent Acquisition', 'Payroll', 'Employee Relations']
  }
];

const updateDepartments = async () => {
  try {
    console.log('Connecting to MongoDB Atlas…');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas Successfully!');

    // 1. Clear & Create IT Departments
    console.log('\n🏢 Creating IT Company Departments…');
    await Department.deleteMany({});
    
    const createdDepts = await Department.insertMany(
      IT_DEPARTMENTS.map(d => ({
        name: d.name,
        description: d.description,
        color: d.color,
        isActive: true
      }))
    );
    console.log(`✅ Created ${createdDepts.length} IT Company Departments.`);

    // 2. Fetch all Users
    const users = await User.find({ employmentStatus: { $ne: 'Terminated' } });
    console.log(`\n👥 Distributing ${users.length} Employees into IT Departments…`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const deptObj = createdDepts[i % createdDepts.length];
      const deptInfo = IT_DEPARTMENTS[i % IT_DEPARTMENTS.length];

      user.department   = deptObj.name;
      user.departmentId = deptObj._id;
      user.skills       = deptInfo.skills;

      // Ensure Admin stays Admin
      if (user.email === 'admin@me.com') {
        user.role = 'Admin';
        user.department = 'Frontend Engineering';
        user.departmentId = createdDepts[0]._id;
      }

      await user.save();
    }

    console.log('✅ Successfully assigned IT departments & skill tags to all employees!');

    // 3. Display Breakdown
    console.log('\n📊 DEPARTMENT BREAKDOWN:');
    const breakdown = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    console.table(breakdown.map(b => ({ Department: b._id, Employees: b.count })));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating departments:', error.message);
    process.exit(1);
  }
};

updateDepartments();
