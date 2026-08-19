const Sprint  = require('../models/Sprint');
const Task    = require('../models/Task');

// POST /api/sprints
exports.createSprint = async (req, res) => {
  try {
    const { projectId, name, goal, startDate, endDate } = req.body;
    if (!projectId || !name) return res.status(400).json({ message: 'projectId and name are required' });

    const sprint = await Sprint.create({
      project: projectId, name, goal,
      startDate: startDate || undefined,
      endDate:   endDate   || undefined,
      createdBy: req.user._id,
    });
    console.log(`Sprint created: ${name} in project ${projectId}`);
    res.status(201).json(sprint);
  } catch (err) {
    console.error('createSprint:', err);
    res.status(500).json({ message: 'Failed to create sprint', error: err.message });
  }
};

// GET /api/sprints?projectId=
exports.getSprints = async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { project: projectId } : {};
    const sprints = await Sprint.find(query)
      .populate('createdBy', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    // Attach task counts per sprint
    const sprintIds = sprints.map(s => s._id);
    const taskCounts = await Task.aggregate([
      { $match: { sprint: { $in: sprintIds } } },
      { $group: { _id: '$sprint', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }, totalPoints: { $sum: '$storyPoints' }, donePoints: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$storyPoints', 0] } } } }
    ]);

    const countMap = {};
    taskCounts.forEach(tc => { countMap[tc._id.toString()] = tc; });

    const enriched = sprints.map(s => ({
      ...s.toObject(),
      taskCount:      countMap[s._id.toString()]?.total        || 0,
      completedCount: countMap[s._id.toString()]?.completed    || 0,
      totalPoints:    countMap[s._id.toString()]?.totalPoints  || 0,
      donePoints:     countMap[s._id.toString()]?.donePoints   || 0,
    }));

    res.json(enriched);
  } catch (err) {
    console.error('getSprints:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/sprints/:id
exports.updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/sprints/:id/start
exports.startSprint = async (req, res) => {
  try {
    // Only one sprint per project can be Active
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    await Sprint.updateMany({ project: sprint.project, status: 'Active' }, { status: 'Planning' });

    sprint.status = 'Active';
    sprint.startDate = sprint.startDate || new Date();
    await sprint.save();

    console.log(`Sprint started: ${sprint.name}`);
    res.json({ message: 'Sprint started', sprint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/sprints/:id/complete
exports.completeSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    // Calculate velocity (total story points of completed tasks)
    const completedTasks = await Task.find({ sprint: sprint._id, status: 'Completed' });
    sprint.velocity     = completedTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
    sprint.status       = 'Completed';
    sprint.completedAt  = new Date();
    await sprint.save();

    console.log(`Sprint completed: ${sprint.name} — velocity: ${sprint.velocity}`);
    res.json({ message: 'Sprint completed', sprint });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/sprints/:id
exports.deleteSprint = async (req, res) => {
  try {
    // Unlink tasks before deleting
    await Task.updateMany({ sprint: req.params.id }, { $unset: { sprint: 1 } });
    await Sprint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sprint deleted and tasks moved to backlog' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/sprints/:id/tasks
exports.getSprintTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ sprint: req.params.id })
      .populate('assignedTo', 'firstName lastName avatar')
      .populate('project', 'name color')
      .sort({ position: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/sprints/task/:taskId/move  — move a task to a sprint or backlog
exports.moveTaskToSprint = async (req, res) => {
  try {
    const { sprintId } = req.body; // null = move to backlog
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      sprintId ? { sprint: sprintId } : { $unset: { sprint: 1 } },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
