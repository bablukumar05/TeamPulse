const Workspace  = require('../models/Workspace');
const Department = require('../models/Department');
const Team       = require('../models/Team');
const User       = require('../models/User');
const logger     = require('../utils/logger');

// ── Workspace ──────────────────────────────────────────────────────────────

exports.createWorkspace = async (req, res) => {
  try {
    const { name, logo } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await Workspace.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Workspace with this name already exists' });

    const workspace = await Workspace.create({ name, slug, logo, owner: req.user._id });

    // Assign workspace to creating user
    await User.findByIdAndUpdate(req.user._id, { workspace: workspace._id });

    logger.info(`Workspace created: ${name} by ${req.user.firstName}`);
    res.status(201).json({ workspace });
  } catch (err) {
    logger.error('createWorkspace error:', err);
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

// ── Departments ────────────────────────────────────────────────────────────

exports.createDepartment = async (req, res) => {
  try {
    const { name, description, color, headId } = req.body;
    const dept = await Department.create({
      name, description, color,
      head: headId || null,
      workspace: req.body.workspaceId || null,
    });
    logger.info(`Department created: ${name}`);
    res.status(201).json(dept);
  } catch (err) {
    logger.error('createDepartment error:', err);
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

// ── Teams ──────────────────────────────────────────────────────────────────

exports.createTeam = async (req, res) => {
  try {
    const { name, description, departmentId, managerId, color } = req.body;
    const team = await Team.create({
      name, description, color,
      department: departmentId || null,
      manager:    managerId || null,
      workspace:  req.body.workspaceId || null,
    });
    logger.info(`Team created: ${name}`);
    res.status(201).json(team);
  } catch (err) {
    logger.error('createTeam error:', err);
    res.status(500).json({ message: 'Failed to create team', error: err.message });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate('manager', 'firstName lastName email avatar')
      .populate('members', 'firstName lastName email avatar role')
      .populate('department', 'name color');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!team) return res.status(404).json({ message: 'Team not found' });
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

// ── User Directory ─────────────────────────────────────────────────────────

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
