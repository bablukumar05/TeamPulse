const User         = require('../models/User');
const Task         = require('../models/Task');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance   = require('../models/Attendance');
const logger       = require('../utils/logger');
const path         = require('path');
const multer       = require('multer');

// ── Performance Review (stored in-memory in User doc via a virtual field)
// We'll use a sub-schema approach: add performanceReviews to User if needed
// For now, we store in User.documents with type='Review'

// GET /api/hr/employees — full employee list with all profile data
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ employmentStatus: 'Active', status: { $ne: 'Deleted' } })
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('departmentId', 'name color')
      .populate('teamId', 'name')
      .populate('managerId', 'firstName lastName avatar')
      .sort({ firstName: 1 });
    res.json(employees);
  } catch (err) {
    logger.error('HR getEmployees:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/hr/employees/:id — single full profile
exports.getEmployeeProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('departmentId', 'name color')
      .populate('teamId', 'name manager')
      .populate('managerId', 'firstName lastName email avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Task stats
    const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.countDocuments({ assignedTo: user._id }),
      Task.countDocuments({ assignedTo: user._id, status: 'Completed' }),
      Task.countDocuments({ assignedTo: user._id, dueDate: { $lt: new Date() }, status: { $nin: ['Completed', 'Archived'] } }),
    ]);

    res.json({ ...user.toObject(), stats: { totalTasks, completedTasks, overdueTasks } });
  } catch (err) {
    logger.error('HR getEmployeeProfile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/hr/employees/:id — update HR-managed fields
exports.updateEmployee = async (req, res) => {
  try {
    const allowed = ['departmentId', 'teamId', 'managerId', 'role', 'baseSalaryLPA', 'joinDate', 'employeeId', 'status', 'isApproved'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    logger.info(`HR updated employee: ${user.firstName}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/hr/employees/:id/documents — upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { name, type } = req.body;
    const docEntry = {
      name:       name || req.file.originalname,
      url:        `/uploads/${req.file.filename}`,
      type:       type || 'Document',
      uploadedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { documents: docEntry } },
      { new: true }
    ).select('firstName lastName documents');

    logger.info(`Document uploaded for ${user.firstName}: ${docEntry.name}`);
    res.json({ message: 'Document uploaded', documents: user.documents });
  } catch (err) {
    logger.error('HR uploadDocument:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/hr/employees/:id/documents/:docIndex
exports.deleteDocument = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const idx = parseInt(req.params.docIndex);
    if (isNaN(idx) || idx < 0 || idx >= user.documents.length) {
      return res.status(400).json({ message: 'Invalid document index' });
    }

    user.documents.splice(idx, 1);
    await user.save();
    res.json({ message: 'Document removed', documents: user.documents });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/hr/leave-requests — all pending leave requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const requests = await LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName avatar department role')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/hr/leave-requests/:id — approve/deny
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Denied'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Denied' });
    }
    const lr = await LeaveRequest.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('employeeId', 'firstName lastName email');
    if (!lr) return res.status(404).json({ message: 'Leave request not found' });

    // Socket notification to employee
    const { io, userSockets } = require('../server').getSocketData?.() || {};
    if (io && userSockets) {
      const socketId = userSockets.get(lr.employeeId._id.toString());
      if (socketId) {
        io.to(socketId).emit('leaveRequestUpdate', {
          message: `Your leave request has been ${status.toLowerCase()}`,
          status,
          requestId: lr._id,
        });
      }
    }

    logger.info(`Leave request ${lr._id} ${status} by ${req.user.firstName}`);
    res.json(lr);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/hr/attendance/report?from&to&userId
exports.getAttendanceReport = async (req, res) => {
  try {
    const { from, to, userId } = req.query;
    const query = {};
    if (userId) query.user = userId;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to)   query.date.$lte = new Date(to);
    }

    const records = await Attendance.find(query)
      .populate('user', 'firstName lastName department avatar')
      .sort({ date: 1 });

    // Summary stats
    const summary = {
      total:    records.length,
      present:  records.filter(r => r.status === 'Present').length,
      late:     records.filter(r => r.isLate).length,
      absent:   records.filter(r => r.status === 'Absent').length,
      wfh:      records.filter(r => r.status === 'WFH').length,
      avgWorkMinutes: records.length > 0
        ? Math.round(records.reduce((a, r) => a + r.totalWorkMinutes, 0) / records.length)
        : 0,
    };

    res.json({ records, summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/hr/stats — summary for HR dashboard header cards
exports.getHRStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      pendingLeaves,
      todayPresent,
      openTasks,
    ] = await Promise.all([
      User.countDocuments({ employmentStatus: 'Active', status: { $ne: 'Deleted' } }),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      Attendance.countDocuments({ date: today, status: { $in: ['Present', 'Late', 'WFH'] } }),
      Task.countDocuments({ status: { $nin: ['Completed', 'Archived'] } }),
    ]);

    res.json({ totalEmployees, pendingLeaves, todayPresent, openTasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
