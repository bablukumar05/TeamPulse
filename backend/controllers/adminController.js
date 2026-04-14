const User = require('../models/User');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const JoinRequest = require('../models/JoinRequest');
const { sendTaskAssignedEmail } = require('../utils/emailService');

exports.getEmployees = async (req, res) => {
  try {
    let query = { role: 'Employee', employmentStatus: { $ne: 'Terminated' } };
    if (req.user.role === 'Manager') {
      query.team = req.user.team;
    }
    const employees = await User.find(query).select('-password');
    
    // For each employee, get their task counts
    const employeesWithTasks = await Promise.all(employees.map(async (employee) => {
      const taskCount = {
        active: await Task.countDocuments({ assignedTo: employee._id, status: 'Active' }),
        newTask: await Task.countDocuments({ assignedTo: employee._id, status: 'New' }),
        completed: await Task.countDocuments({ assignedTo: employee._id, status: 'Completed' }),
        failed: await Task.countDocuments({ assignedTo: employee._id, status: 'Failed' }),
      };
      
      return {
        ...employee._doc,
        taskCount
      };
    }));

    res.status(200).json(employeesWithTasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, date, category, assignTo, projectId } = req.body;

    let query = { firstName: assignTo, role: 'Employee' };
    if (req.user.role === 'Manager') {
      query.team = req.user.team;
    }

    const employee = await User.findOne(query);

    if (!employee) {
      return res.status(404).json({ message: `Employee ${assignTo} not found in your allowed scope` });
    }

    const task = new Task({
      title,
      description,
      date,
      category,
      assignedTo: employee._id,
      project: projectId || undefined,
      status: 'New'
    });

    await task.save();

    await AuditLog.create({
      action: 'TASK_CREATED',
      performedBy: req.user._id,
      performedByName: req.user.firstName,
      details: `Created task "${title}" assigned to ${assignTo}`
    });

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets) {
      const socketId = userSockets.get(employee._id.toString());
      if (socketId) {
        io.to(socketId).emit('newTaskAssigned', { message: `New Task: ${title}`, task });
      }
    }

    sendTaskAssignedEmail(employee.email, employee.firstName, title);

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    let tasks = await Task.find().populate('assignedTo', 'firstName team');
    
    if (req.user.role === 'Manager') {
      tasks = tasks.filter(task => task.assignedTo && task.assignedTo.team === req.user.team);
    }
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTaskStatusAdmin = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Active', 'Completed', 'Failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    if (previousStatus !== status) {
      await AuditLog.create({
        action: 'TASK_STATUS_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.firstName,
        details: `Moved task "${task.title}" to ${status} (formerly ${previousStatus})`
      });
    }

    // Gamification Engine
    if (status === 'Completed' && previousStatus !== 'Completed') {
      const user = await User.findById(task.assignedTo);
      if (user) {
        user.xp += 50;
        const uniqueBadges = new Set(user.badges);
        if (user.xp >= 200) uniqueBadges.add('Bronze Challenger');
        if (user.xp >= 500) uniqueBadges.add('Silver Specialist');
        if (user.xp >= 1000) uniqueBadges.add('Gold Elite');
        if (user.xp >= 5000) uniqueBadges.add('Platinum Master');
        user.badges = Array.from(uniqueBadges);
        await user.save();
      }
    }

    // Notify the employee that Admin changed their task status
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets) {
      const socketId = userSockets.get(task.assignedTo.toString());
      if (socketId) {
        io.to(socketId).emit('newTaskAssigned', { message: `Task "${task.title}" status changed to ${status} by Admin`, task });
      }
    }

    res.status(200).json({ message: 'Task status updated via Kanban', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { team, role } = req.body;

    const employee = await User.findById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Prevent non-admins from changing roles
    if (req.user.role !== 'Admin') {
       return res.status(403).json({ message: "Only full Admins can modify employee records." });
    }

    if (team) employee.team = team;
    if (role && ['Admin', 'Manager', 'Employee'].includes(role)) employee.role = role;

    await employee.save();

    await AuditLog.create({
      action: 'EMPLOYEE_UPDATED',
      performedBy: req.user._id,
      performedByName: req.user.firstName,
      details: `Updated employee ${employee.firstName} (Team: ${employee.team}, Role: ${employee.role})`
    });

    res.status(200).json({ message: "Employee updated successfully", employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTerminatedEmployees = async (req, res) => {
  try {
    const list = await User.find({ employmentStatus: 'Terminated', role: 'Employee' }).select('-password');
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.terminateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findById(id);
    if (!employee) return res.status(404).json({ message: 'Not found' });

    employee.employmentStatus = 'Terminated';
    employee.isApproved = false; // Block tokens securely
    await employee.save();

    // Mark all New/Active tasks as Failed so they don't clog up completion metrics
    await Task.updateMany(
      { assignedTo: employee._id, status: { $in: ['New', 'Active'] } },
      { $set: { status: 'Failed' } }
    );

    await AuditLog.create({
      action: 'EMPLOYEE_TERMINATED',
      performedBy: req.user._id,
      performedByName: req.user.firstName,
      details: `Admin terminated employee ${employee.firstName}. Active tasks have been cancelled.`
    });

    res.status(200).json({ message: 'Employee terminated successfully', employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.restoreEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findById(id);
    if (!employee) return res.status(404).json({ message: 'Not found' });

    employee.employmentStatus = 'Active';
    employee.isApproved = true; 
    await employee.save();

    await AuditLog.create({
      action: 'EMPLOYEE_RESTORED',
      performedBy: req.user._id,
      performedByName: req.user.firstName,
      details: `Admin officially restored employee ${employee.firstName}.`
    });

    res.status(200).json({ message: 'Employee restored successfully', employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllLeaveRequests = async (req, res) => {
  try {
    const LeaveRequest = require('../models/LeaveRequest');
    const leaveRequests = await LeaveRequest.find().populate('employeeId', 'firstName lastName email team').sort({ createdAt: -1 });
    res.status(200).json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Approved', 'Denied'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const LeaveRequest = require('../models/LeaveRequest');
    const leaveRequest = await LeaveRequest.findById(id).populate('employeeId', 'firstName lastName');

    if (!leaveRequest) return res.status(404).json({ message: "Leave request not found" });

    leaveRequest.status = status;
    await leaveRequest.save();

    await AuditLog.create({
      action: 'LEAVE_REQUEST_UPDATED',
      performedBy: req.user._id,
      performedByName: req.user.firstName,
      details: `Marked leave request for ${leaveRequest.employeeId?.firstName || 'Employee'} as ${status}`
    });

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets) {
      const socketId = userSockets.get(leaveRequest.employeeId._id.toString());
      if (socketId) {
        io.to(socketId).emit('leaveRequestUpdate', { message: `Your leave request has been ${status}`, request: leaveRequest });
      }
    }

    res.status(200).json({ message: `Leave request ${status}`, leaveRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getJoinRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ status: 'Pending' })
      .populate('userId', 'firstName email')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, offerLPA } = req.body; // 'approve' or 'reject'

    const request = await JoinRequest.findById(id).populate('userId');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (action === 'approve') {
      request.status = 'Approved';
      // Update User
      await User.findByIdAndUpdate(request.userId._id, { 
        isApproved: true,
        baseSalaryLPA: offerLPA ? Number(offerLPA) : 0
      });
    } else {
      request.status = 'Rejected';
    }

    await request.save();

    await AuditLog.create({
      action: 'JOIN_REQUEST_PROCESSED',
      performedBy: req.user._id,
      performedByName: req.user.firstName,
      details: `${action === 'approve' ? 'Approved' : 'Rejected'} join request for ${request.userId.firstName}`
    });

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets) {
      const socketId = userSockets.get(request.userId._id.toString());
      if (socketId) {
        io.to(socketId).emit('joinRequestApproved', { message: `Your join request has been ${action}d!` });
      }
    }

    res.status(200).json({ message: `Request ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
