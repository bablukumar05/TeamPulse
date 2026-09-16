const Workspace  = require('../models/Workspace');
const Department = require('../models/Department');
const Team       = require('../models/Team');
const User       = require('../models/User');


exports.createWorkspace = async (req, res) => {
  try {
    const { name, logo } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await Workspace.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Workspace with this name already exists' });

    const workspace = await Workspace.create({ name, slug, logo, owner: req.user._id });

    // Assign workspace to creating user
    await User.findByIdAndUpdate(req.user._id, { workspace: workspace._id });

    console.log(`Workspace created: ${name} by ${req.user.firstName}`);
    res.status(201).json({ workspace });
  } catch (err) {
    console.error('createWorkspace error:', err);
    res.status(500).json({ message: 'Failed to create workspace', error: err.message });
  }
};

exports.getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate('owner', 'firstName lastName email');
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getWorkspaceMembers = async (req, res) => {
  try {
    const users = await User.find({ workspace: req.params.id })
      .select('firstName lastName email role department avatar isOnline lastSeen employeeId');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.createDepartment = async (req, res) => {
  try {
    const { name, description, color, headId } = req.body;
    const dept = await Department.create({
      name, description, color,
      head: headId || null,
      workspace: req.body.workspaceId || null,
    });
    console.log(`Department created: ${name}`);
    res.status(201).json(dept);
  } catch (err) {
    console.error('createDepartment error:', err);
    res.status(500).json({ message: 'Failed to create department', error: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const depts = await Department.find({ isActive: true })
      .populate('head', 'firstName lastName email avatar')
      .populate('members', 'firstName lastName email avatar role');
    res.json(depts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Department archived' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addMemberToDepartment = async (req, res) => {
  try {
    const { userId } = req.body;
    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    );
    await User.findByIdAndUpdate(userId, { departmentId: req.params.id, department: dept.name });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.createTeam = async (req, res) => {
  try {
    const { name, description, departmentId, managerId, color } = req.body;
    const team = await Team.create({
      name, description, color,
      department: departmentId || null,
      manager:    managerId || null,
      workspace:  req.body.workspaceId || null,
    });
    console.log(`Team created: ${name}`);
    res.status(201).json(team);
  } catch (err) {
    console.error('createTeam error:', err);
    res.status(500).json({ message: 'Failed to create team', error: err.message });
  }
};

exports.getTeams = async (req, res) => {
  try {
    let teams = await Team.find({ isActive: true })
      .populate('manager', 'firstName lastName email avatar role designation')
      .populate('members', 'firstName lastName email avatar role designation department isOnline skills')
      .populate('department', 'name color description');

    // If no teams exist, automatically seed the 4 standard enterprise squads
    if (teams.length === 0) {
      const defaultDepts = [
        { name: "Engineering & Technology", color: "#3b82f6", description: "Software Architecture, Full-Stack & Core Platform" },
        { name: "AI & Data Intelligence", color: "#8b5cf6", description: "Machine Learning, LLMs, AI Agents & Analytics" },
        { name: "Quality Assurance", color: "#10b981", description: "Automation Testing, Performance & Quality Standards" },
        { name: "Product & Design", color: "#ec4899", description: "UI/UX, Product Roadmaps & User Research" },
        { name: "Operations & HR", color: "#f59e0b", description: "People Operations, Talent Acquisition & Culture" }
      ];

      const createdDepts = {};
      for (const d of defaultDepts) {
        let dept = await Department.findOne({ name: d.name, isActive: true });
        if (!dept) {
          dept = await Department.create(d);
        }
        createdDepts[d.name] = dept._id;
      }

      const defaultTeams = [
        {
          name: "AI & Machine Learning Squad",
          department: createdDepts["AI & Data Intelligence"],
          color: "#8b5cf6",
          description: "LLMs, Computer Vision, RAG Pipelines & Data Science"
        },
        {
          name: "Product Development Squad",
          department: createdDepts["Engineering & Technology"],
          color: "#3b82f6",
          description: "Full-Stack Web & Mobile App Architecture"
        },
        {
          name: "Database & Cloud Operations",
          department: createdDepts["Engineering & Technology"],
          color: "#06b6d4",
          description: "Database Administration (DBA), Cloud Infra & DevOps"
        },
        {
          name: "Quality Assurance & Testing (QA)",
          department: createdDepts["Quality Assurance"],
          color: "#10b981",
          description: "Automated & Manual End-to-End Quality Engineering"
        }
      ];

      for (const t of defaultTeams) {
        const exists = await Team.findOne({ name: t.name, isActive: true });
        if (!exists) {
          await Team.create(t);
        }
      }

      teams = await Team.find({ isActive: true })
        .populate('manager', 'firstName lastName email avatar role designation')
        .populate('members', 'firstName lastName email avatar role designation department isOnline skills')
        .populate('department', 'name color description');
    }

    const Task = require('../models/Task');
    const teamsWithStats = await Promise.all(teams.map(async (team) => {
      const memberIds = (team.members || []).map(m => m._id);
      const activeTasks = await Task.countDocuments({
        $or: [
          { teamId: team._id },
          { assignedTo: { $in: memberIds } }
        ],
        status: { $nin: ['Completed', 'Archived', 'Failed'] }
      });
      return {
        ...team.toObject(),
        activeTasks
      };
    }));

    res.json(teamsWithStats);
  } catch (err) {
    console.error('getTeams error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { manager } = req.body;
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // If manager was assigned, ensure their role is Manager
    if (manager) {
      await User.findByIdAndUpdate(manager, { role: 'Manager', teamId: team._id });
    }

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    await Team.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Team archived' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addMemberToTeam = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    );
    await User.findByIdAndUpdate(userId, { teamId: req.params.id });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.removeMemberFromTeam = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: userId } },
      { new: true }
    );
    await User.findByIdAndUpdate(userId, { teamId: null });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.getUserDirectory = async (req, res) => {
  try {
    const { search, department, team, role } = req.query;
    const query = { employmentStatus: 'Active', status: { $ne: 'Deleted' } };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { employeeId:{ $regex: search, $options: 'i' } },
      ];
    }
    if (department) query.department = department;
    if (role)       query.role = role;

    const users = await User.find(query)
      .select('firstName lastName email role department team avatar isOnline lastSeen employeeId skills')
      .populate('departmentId', 'name color')
      .populate('teamId', 'name')
      .populate('managerId', 'firstName lastName avatar')
      .sort({ firstName: 1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('departmentId', 'name color')
      .populate('teamId', 'name manager')
      .populate('managerId', 'firstName lastName email avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const allowed = ['lastName', 'phone', 'bio', 'skills', 'experience', 'timezone', 'dateOfBirth'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
