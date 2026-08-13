const User = require('../models/User');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const JoinRequest = require('../models/JoinRequest');
const { sendTaskAssignedEmail } = require('../utils/emailService');
const logger = require('../utils/logger');


exports.getEmployees = async (req, res) => {
  try {
    let query = { role: 'Employee', employmentStatus: { $ne: 'Terminated' } };
    if (req.user.role === 'Manager') {
      query.team = req.user.team;
    }
    const employees = await User.find(query).select('-password').lean();
    const empIds = employees.map(e => e._id);

    // Single aggregation query for all employees
    const taskCounts = await Task.aggregate([
      { $match: { assignedTo: { $in: empIds } } },
      {
        $group: {
          _id: '$assignedTo',
          active:    { $sum: { $cond: [{ $in: ['$status', ['In Progress', 'Active']] }, 1, 0] } },
          newTask:   { $sum: { $cond: [{ $in: ['$status', ['To Do', 'New']] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          failed:    { $sum: { $cond: [{ $in: ['$status', ['Blocked', 'Failed']] }, 1, 0] } },
        }
      }
    ]);

    const countMap = {};
    taskCounts.forEach(tc => { countMap[tc._id.toString()] = tc; });

    const employeesWithTasks = employees.map(emp => ({
      ...emp,
      taskCount: countMap[emp._id.toString()] || { active: 0, newTask: 0, completed: 0, failed: 0 }
    }));

    res.status(200).json(employeesWithTasks);
  } catch (error) {
    logger.error('getEmployees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, date, dueDate, category, assignTo, projectId, priority, labels, estimatedHours, checklist } = req.body;

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
      date: date || (dueDate ? new Date(dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      category: category || 'General',
      priority: priority || 'Medium',
      labels: labels || (category ? [category] : []),
      estimatedHours: Number(estimatedHours) || 0,
      checklist: checklist || [],
      assignedTo: employee._id,
      createdBy: req.user._id,
      department: req.user.team || 'General',
      project: projectId || undefined,
      status: 'To Do',
      activityLog: [{
        action: `Task created and assigned to ${employee.firstName}`,
        performedBy: req.user._id,
        performedByName: req.user.firstName,
        timestamp: new Date()
      }]
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
    logger.error('CreateTask Admin Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    let tasks = await Task.find()
      .populate('assignedTo', 'firstName team email avatar')
      .populate('createdBy', 'firstName email')
      .populate('project', 'name');
    
    if (req.user.role === 'Manager') {
      tasks = tasks.filter(task => task.assignedTo && task.assignedTo.team === req.user.team);
    }
    
    res.status(200).json(tasks);
  } catch (error) {
    logger.error('GetAllTasks Admin Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTaskStatusAdmin = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'Backlog',
      'To Do',
      'In Progress',
      'Code Review',
      'Testing / QA',
      'Ready for Deployment',
      'Completed',
      'Blocked',
      'Archived',
      'New',
      'Active',
      'Failed'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const previousStatus = task.status;
    task.status = status;
    if (status === 'Completed' && previousStatus !== 'Completed') {
      task.completedAt = new Date();
    }

    task.activityLog.push({
      action: `Status changed from "${previousStatus}" to "${status}"`,
      performedBy: req.user._id,
      performedByName: req.user.firstName,
      timestamp: new Date()
    });

    await task.save();

    if (previousStatus !== status) {
      await AuditLog.create({
        action: 'TASK_STATUS_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.firstName,
        details: `Moved task "${task.title}" from "${previousStatus}" to "${status}"`
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

    // Notify employee via Socket.IO
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    if (io && userSockets && task.assignedTo) {
      const socketId = userSockets.get(task.assignedTo.toString());
      if (socketId) {
        io.to(socketId).emit('newTaskAssigned', { message: `Task "${task.title}" status changed to ${status}`, task });
      }
    }

    res.status(200).json({ message: 'Task status updated', task });
  } catch (error) {
    logger.error('UpdateTaskStatusAdmin Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTaskDetailsAdmin = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, labels, checklist, estimatedHours, actualHours, dueDate, startDate, status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const who = req.user.firstName;
    const activityEntries = [];

    if (title && title !== task.title) {
      activityEntries.push(`Title changed to "${title}" by ${who}`);
      task.title = title;
    }
    if (description !== undefined && description !== task.description) {
      task.description = description;
      activityEntries.push(`Description updated by ${who}`);
    }
    if (priority && priority !== task.priority) {
      activityEntries.push(`Priority changed from "${task.priority}" to "${priority}" by ${who}`);
      task.priority = priority;
    }
    if (labels) task.labels = labels;
    if (checklist !== undefined) {
      task.checklist = checklist;
      activityEntries.push(`Checklist updated by ${who}`);
    }
    if (estimatedHours !== undefined) {
      task.estimatedHours = Number(estimatedHours);
      activityEntries.push(`Estimated hours set to ${estimatedHours}h by ${who}`);
    }
    if (actualHours !== undefined) {
      const prev = task.actualHours || 0;
      task.actualHours = Number(actualHours);
      const diff = Number(actualHours) - prev;
      activityEntries.push(`Time logged: ${diff > 0 ? '+' : ''}${diff.toFixed(1)}h by ${who}`);
    }
    if (dueDate) {
      task.dueDate = new Date(dueDate);
      activityEntries.push(`Due date set to ${new Date(dueDate).toLocaleDateString()} by ${who}`);
    }
    if (startDate) {
      task.startDate = new Date(startDate);
      activityEntries.push(`Start date set to ${new Date(startDate).toLocaleDateString()} by ${who}`);
    }
    if (status && status !== task.status) {
      activityEntries.push(`Status changed to "${status}" by ${who}`);
      task.status = status;
    }

    const logMessage = activityEntries.length > 0
      ? activityEntries.join('; ')
      : `Task details updated by ${who}`;

    task.activityLog.push({
      action: logMessage,
      performedBy: req.user._id,
      performedByName: who,
      timestamp: new Date()
    });

    await task.save();
    res.status(200).json({ message: 'Task details updated successfully', task });
  } catch (error) {
    logger.error('UpdateTaskDetailsAdmin Error:', error);
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
    const { reason, details, severanceNotice } = req.body;

    const employee = await User.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const finalReason    = reason || 'Performance / Policy Standards';
    const finalDetails   = details || 'Official employment contract terminated by management in accordance with company policy.';
    const finalSeverance = severanceNotice || '30 Days Notice / Final Settlement as per company HR policy.';

    employee.employmentStatus = 'Terminated';
    employee.isApproved = false; // Revoke login access
    employee.terminationReason  = finalReason;
    employee.terminationDetails = finalDetails;
    employee.severanceNotice    = finalSeverance;
    employee.terminatedAt       = new Date();
    employee.terminatedBy       = req.user._id;

    // Attach Official Termination Letter to Employee Documents Vault
    const letterName = `Termination_and_Rights_Notice_${new Date().toISOString().split('T')[0]}.pdf`;
    employee.documents.push({
      name: letterName,
      url: `data:text/plain;charset=utf-8,OFFICIAL%20TERMINATION%20LETTER%0A%0AEmployee%3A%20${encodeURIComponent(employee.firstName + ' ' + (employee.lastName || ''))}%0AEmployee%20ID%3A%20${encodeURIComponent(employee.employeeId || 'N/A')}%0ADate%3A%20${new Date().toLocaleDateString()}%0A%0AReason%20for%20Termination%3A%20${encodeURIComponent(finalReason)}%0A%0ADetails%20%26%20Rights%3A%20${encodeURIComponent(finalDetails)}%0A%0ASeverance%20%26%20Notice%3A%20${encodeURIComponent(finalSeverance)}%0A%0AHR%20Contact%3A%20hr@teampulse.com`,
      type: 'Contract',
      uploadedAt: new Date()
    });

    await employee.save();

    // Mark active tasks as Failed
    await Task.updateMany(
      { assignedTo: employee._id, status: { $in: ['New', 'Active', 'To Do', 'In Progress'] } },
      { $set: { status: 'Failed' } }
    );

    // Create System Notification for Employee Rights & Reason
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: employee._id,
      type: 'system',
      title: '⚠️ Official Notice: Employment Status Terminated',
      body: `Reason: ${finalReason}. Details: ${finalDetails.substring(0, 120)}… You can access your Termination Letter in your Document Vault.`,
      link: '/profile'
    }).catch(e => logger.error('Notification create error:', e));

    await AuditLog.create({
      action: 'EMPLOYEE_TERMINATED',
      performedBy: req.user._id,
      performedByName: req.user.firstName,
      details: `Terminated employee ${employee.firstName} (${employee.email}). Reason: ${finalReason}`
    });

    res.status(200).json({
      message: 'Employee terminated successfully. Termination letter generated and notification sent.',
      employee
    });
  } catch (error) {
    logger.error('terminateEmployee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
