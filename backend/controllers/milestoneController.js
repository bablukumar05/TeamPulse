const Milestone = require('../models/Milestone');
const Task      = require('../models/Task');
const logger    = require('../utils/logger');

// POST /api/milestones
exports.createMilestone = async (req, res) => {
  try {
    const { projectId, name, description, dueDate, color } = req.body;
    if (!projectId || !name) return res.status(400).json({ message: 'projectId and name are required' });

    const milestone = await Milestone.create({
      project: projectId, name, description,
      dueDate: dueDate || undefined,
      color: color || '#f59e0b',
      createdBy: req.user._id,
    });
    logger.info(`Milestone created: ${name}`);
    res.status(201).json(milestone);
  } catch (err) {
    logger.error('createMilestone:', err);
    res.status(500).json({ message: 'Failed to create milestone', error: err.message });
  }
};

// GET /api/milestones?projectId=
exports.getMilestones = async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { project: projectId } : {};

    const milestones = await Milestone.find(query)
      .populate('createdBy', 'firstName lastName avatar')
      .sort({ dueDate: 1 });

    // Attach task completion per milestone
    const milestoneIds = milestones.map(m => m._id);
    const taskStats = await Task.aggregate([
      { $match: { milestone: { $in: milestoneIds } } },
      { $group: {
        _id: '$milestone',
        total:     { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
      }}
    ]);

    const statsMap = {};
    taskStats.forEach(s => { statsMap[s._id.toString()] = s; });

    const enriched = milestones.map(m => {
      const stats = statsMap[m._id.toString()] || { total: 0, completed: 0 };
      return {
        ...m.toObject(),
        taskCount:       stats.total,
        completedCount:  stats.completed,
        completionPercent: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      };
    });

    res.json(enriched);
  } catch (err) {
    logger.error('getMilestones:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/milestones/:id
exports.updateMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/milestones/:id
exports.deleteMilestone = async (req, res) => {
  try {
    await Task.updateMany({ milestone: req.params.id }, { $unset: { milestone: 1 } });
    await Milestone.findByIdAndDelete(req.params.id);
    res.json({ message: 'Milestone deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/milestones/:id/tasks
exports.getMilestoneTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ milestone: req.params.id })
      .populate('assignedTo', 'firstName lastName avatar')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
