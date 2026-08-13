const Task       = require('../models/Task');
const User       = require('../models/User');
const Attendance = require('../models/Attendance');
const Sprint     = require('../models/Sprint');
const LeaveRequest = require('../models/LeaveRequest');
const logger     = require('../utils/logger');

// GET /api/reports/productivity
exports.getProductivityReport = async (req, res) => {
  try {
    const { from, to, department } = req.query;
    const taskQuery = {};
    if (from || to) {
      taskQuery.createdAt = {};
      if (from) taskQuery.createdAt.$gte = new Date(from);
      if (to)   taskQuery.createdAt.$lte = new Date(to);
    }
    if (department) taskQuery.department = department;

    const tasks = await Task.find(taskQuery)
      .populate('assignedTo', 'firstName lastName avatar department role');

    // Aggregate by user
    const userMap = {};
    tasks.forEach(t => {
      if (!t.assignedTo) return;
      const uId = t.assignedTo._id.toString();
      if (!userMap[uId]) {
        userMap[uId] = {
          user: t.assignedTo,
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          storyPoints: 0
        };
      }
      userMap[uId].total += 1;
      if (t.status === 'Completed') {
        userMap[uId].completed += 1;
        userMap[uId].storyPoints += (t.storyPoints || 0);
      } else if (t.status === 'In Progress') {
        userMap[uId].inProgress += 1;
      }
      if (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed') {
        userMap[uId].overdue += 1;
      }
    });

    const report = Object.values(userMap).map(u => ({
      ...u,
      completionRate: u.total > 0 ? Math.round((u.completed / u.total) * 100) : 0
    }));

    res.json(report);
  } catch (err) {
    logger.error('getProductivityReport error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/reports/attendance
exports.getAttendanceReport = async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const targetMonth = parseInt(month) || new Date().getMonth();
    const targetYear  = parseInt(year)  || new Date().getFullYear();

    const startDate = new Date(Date.UTC(targetYear, targetMonth, 1));
    const endDate   = new Date(Date.UTC(targetYear, targetMonth + 1, 0));

    const records = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('user', 'firstName lastName avatar department role');

    const summary = {
      month: targetMonth,
      year: targetYear,
      totalRecords: records.length,
      present: records.filter(r => r.status === 'Present').length,
      late: records.filter(r => r.isLate).length,
      absent: records.filter(r => r.status === 'Absent').length,
      wfh: records.filter(r => r.status === 'WFH').length,
      avgWorkMinutes: records.length > 0
        ? Math.round(records.reduce((acc, r) => acc + (r.totalWorkMinutes || 0), 0) / records.length)
        : 0
    };

    res.json({ records, summary });
  } catch (err) {
    logger.error('getAttendanceReport error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/reports/sprints
exports.getSprintReport = async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { project: projectId } : {};

    const sprints = await Sprint.find(query)
      .populate('project', 'name color')
      .sort({ createdAt: -1 });

    const sprintIds = sprints.map(s => s._id);
    const tasks = await Task.find({ sprint: { $in: sprintIds } });

    const report = sprints.map(s => {
      const sTasks = tasks.filter(t => t.sprint?.toString() === s._id.toString());
      const completed = sTasks.filter(t => t.status === 'Completed');
      return {
        _id: s._id,
        name: s.name,
        projectName: s.project?.name || 'Unassigned',
        status: s.status,
        totalTasks: sTasks.length,
        completedTasks: completed.length,
        totalPoints: sTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0),
        completedPoints: completed.reduce((acc, t) => acc + (t.storyPoints || 0), 0),
        velocity: s.velocity || 0,
      };
    });

    res.json(report);
  } catch (err) {
    logger.error('getSprintReport error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/reports/leaves
exports.getLeaveReport = async (req, res) => {
  try {
    const employees = await User.find({ employmentStatus: 'Active', status: { $ne: 'Deleted' } })
      .select('firstName lastName email department role avatar');

    const leaves = await LeaveRequest.find({});

    const report = employees.map(emp => {
      const empLeaves = leaves.filter(l => l.employeeId?.toString() === emp._id.toString());
      const approved = empLeaves.filter(l => l.status === 'Approved');
      const pending  = empLeaves.filter(l => l.status === 'Pending');

      const daysUsed = approved.reduce((acc, l) => {
        const start = new Date(l.startDate);
        const end   = new Date(l.endDate);
        const diff  = Math.ceil((end - start) / 86400000) + 1;
        return acc + (isNaN(diff) ? 1 : diff);
      }, 0);

      return {
        user: emp,
        totalApplied: empLeaves.length,
        approved: approved.length,
        pending: pending.length,
        daysUsed,
        annualRemaining: Math.max(0, 18 - daysUsed),
      };
    });

    res.json(report);
  } catch (err) {
    logger.error('getLeaveReport error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
