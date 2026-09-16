const User         = require('../models/User');
const Task         = require('../models/Task');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance   = require('../models/Attendance');
const path         = require('path');
const multer       = require('multer');

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
    console.error('HR getEmployees:', err);
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
    console.error('HR getEmployeeProfile:', err);
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
    console.log(`HR updated employee: ${user.firstName}`);
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

    console.log(`Document uploaded for ${user.firstName}: ${docEntry.name}`);
    res.json({ message: 'Document uploaded', documents: user.documents });
  } catch (err) {
    console.error('HR uploadDocument:', err);
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

    if (status === 'Approved') {
      try {
        const cur = new Date(lr.startDate);
        const end = new Date(lr.endDate);
        cur.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(0, 0, 0, 0);
        const empId = lr.employeeId._id || lr.employeeId;
        while (cur <= end) {
          const dayOfWeek = cur.getUTCDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            const leaveDate = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));
            await Attendance.findOneAndUpdate(
              { user: empId, date: leaveDate },
              { $set: { status: 'On Leave', notes: lr.reason || 'Approved Leave' } },
              { upsert: true }
            );
          }
          cur.setUTCDate(cur.getUTCDate() + 1);
        }
      } catch (attErr) {
        console.warn('Could not sync attendance for approved leave:', attErr);
      }
    }

    // Socket notification to employee
    const { io, userSockets } = require('../server').getSocketData?.() || {};
    if (io && userSockets) {
      const socketId = userSockets.get((lr.employeeId._id || lr.employeeId).toString());
      if (socketId) {
        io.to(socketId).emit('leaveRequestUpdate', {
          message: `Your leave request has been ${status.toLowerCase()}`,
          status,
          requestId: lr._id,
        });
      }
    }

    console.log(`Leave request ${lr._id} ${status} by ${req.user.firstName}`);
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
      .populate('user', 'firstName lastName department role')
      .sort({ date: -1 });

    const summary = {
      total:   records.length,
      present: records.filter(r => r.status === 'Present').length,
      late:    records.filter(r => r.status === 'Late').length,
      absent:  records.filter(r => r.status === 'Absent').length,
      wfh:     records.filter(r => r.status === 'WFH').length,
      leaves:  records.filter(r => r.status === 'On Leave').length,
      avgWorkMinutes: records.length ? Math.round(records.reduce((a, r) => a + (r.totalWorkMinutes || 0), 0) / records.length) : 0,
    };

    res.json({ records, summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/hr/attendance/yearly-report?year=&department=
exports.getYearlyAttendanceReport = async (req, res) => {
  try {
    const year = req.query.year !== undefined && req.query.year !== '' 
      ? parseInt(req.query.year, 10) 
      : new Date().getFullYear();
    const department = req.query.department;

    const userQuery = { employmentStatus: 'Active', status: { $ne: 'Deleted' } };
    if (department && department !== 'All') {
      userQuery.department = department;
    }

    const employees = await User.find(userQuery)
      .select('firstName lastName avatar department role employeeId')
      .sort({ firstName: 1 });

    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate   = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const employeeIds = employees.map(e => e._id);
    const [attendanceRecords, approvedLeaves] = await Promise.all([
      Attendance.find({
        user: { $in: employeeIds },
        date: { $gte: startDate, $lte: endDate }
      }),
      LeaveRequest.find({
        employeeId: { $in: employeeIds },
        status: 'Approved',
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      })
    ]);

    const attendanceMap = {};
    employees.forEach(emp => {
      const id = emp._id.toString();
      attendanceMap[id] = {
        employee: emp,
        leaveDates: new Set(),
        months: Array.from({ length: 12 }, (_, m) => ({
          month: m,
          present: 0,
          late: 0,
          absent: 0,
          wfh: 0,
          leaves: 0,
          halfDay: 0,
          totalWorkMinutes: 0,
          totalLoggedDays: 0
        })),
        totalPresent: 0,
        totalLeaves: 0,
        totalWFH: 0,
        totalLate: 0,
        totalAbsent: 0,
        totalHours: 0,
        annualAttendanceRate: 0
      };
    });

    attendanceRecords.forEach(r => {
      const uId = r.user.toString();
      if (!attendanceMap[uId]) return;

      const d = new Date(r.date);
      const m = d.getUTCMonth();
      if (m < 0 || m > 11) return;

      const monthData = attendanceMap[uId].months[m];
      monthData.totalLoggedDays += 1;
      const dateKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;

      if (r.status === 'Present') {
        if (r.isLate) {
          monthData.late += 1;
          attendanceMap[uId].totalLate += 1;
        }
        monthData.present += 1;
        attendanceMap[uId].totalPresent += 1;
      } else if (r.status === 'Late') {
        monthData.late += 1;
        monthData.present += 1;
        attendanceMap[uId].totalPresent += 1;
        attendanceMap[uId].totalLate += 1;
      } else if (r.status === 'On Leave') {
        if (!attendanceMap[uId].leaveDates.has(dateKey)) {
          attendanceMap[uId].leaveDates.add(dateKey);
          monthData.leaves += 1;
          attendanceMap[uId].totalLeaves += 1;
        }
      } else if (r.status === 'WFH') {
        monthData.wfh += 1;
        attendanceMap[uId].totalWFH += 1;
      } else if (r.status === 'Half-Day') {
        monthData.halfDay += 1;
        monthData.present += 0.5;
        attendanceMap[uId].totalPresent += 0.5;
        if (!attendanceMap[uId].leaveDates.has(dateKey)) {
          attendanceMap[uId].leaveDates.add(dateKey);
          monthData.leaves += 0.5;
          attendanceMap[uId].totalLeaves += 0.5;
        }
      } else if (r.status === 'Absent') {
        monthData.absent += 1;
        attendanceMap[uId].totalAbsent += 1;
      }

      const mins = r.totalWorkMinutes || 0;
      monthData.totalWorkMinutes += mins;
      attendanceMap[uId].totalHours += Math.round(mins / 60);
    });

    approvedLeaves.forEach(lr => {
      const uId = (lr.employeeId._id || lr.employeeId).toString();
      if (!attendanceMap[uId]) return;

      const cur = new Date(Math.max(new Date(lr.startDate).getTime(), startDate.getTime()));
      const end = new Date(Math.min(new Date(lr.endDate).getTime(), endDate.getTime()));
      cur.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(0, 0, 0, 0);

      while (cur <= end) {
        const dayOfWeek = cur.getUTCDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const m = cur.getUTCMonth();
          const dateKey = `${cur.getUTCFullYear()}-${cur.getUTCMonth()}-${cur.getUTCDate()}`;
          if (!attendanceMap[uId].leaveDates.has(dateKey)) {
            attendanceMap[uId].leaveDates.add(dateKey);
            attendanceMap[uId].months[m].leaves += 1;
            attendanceMap[uId].totalLeaves += 1;
          }
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    });

    const reportList = Object.values(attendanceMap).map(item => {
      delete item.leaveDates;
      const activeDays = item.totalPresent + item.totalLeaves + item.totalAbsent + item.totalWFH;
      item.annualAttendanceRate = activeDays > 0 
        ? Math.round(((item.totalPresent + item.totalWFH) / activeDays) * 100) 
        : 0;
      return item;
    });

    res.json({
      year,
      totalEmployees: employees.length,
      report: reportList
    });
  } catch (err) {
    console.error('getYearlyAttendanceReport error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
