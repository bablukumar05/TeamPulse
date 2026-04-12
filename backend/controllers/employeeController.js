const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const { sendTaskStatusEmail } = require('../utils/emailService');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id });
    
    const taskCount = {
      active: tasks.filter(t => t.status === 'Active').length,
      newTask: tasks.filter(t => t.status === 'New').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      failed: tasks.filter(t => t.status === 'Failed').length,
    };

    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    res.status(200).json({ 
      tasks, 
      taskCount, 
      xp: user.xp || 0, 
      badges: user.badges || ['Rookie'] 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Active', 'Completed', 'Failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findOne({ _id: taskId, assignedTo: req.user._id });

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
        performedByName: req.user.firstName || 'Employee',
        details: `Marked task "${task.title}" as ${status}`
      });
    }

    // Gamification Engine
    if (status === 'Completed') {
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      user.xp += 50;

      // Badge Evaluation
      const uniqueBadges = new Set(user.badges);
      if (user.xp >= 200) uniqueBadges.add('Bronze Challenger');
      if (user.xp >= 500) uniqueBadges.add('Silver Specialist');
      if (user.xp >= 1000) uniqueBadges.add('Gold Elite');
      if (user.xp >= 5000) uniqueBadges.add('Platinum Master');
      user.badges = Array.from(uniqueBadges);

      await user.save();
    }

    if (status === 'Completed' || status === 'Failed') {
      const io = req.app.get('io');
      if (io) {
        io.to('admins').emit('adminTaskNotification', {
          message: `${req.user.firstName} marked task "${task.title}" as ${status}.`,
          status: status
        });
      }

      const User = require('../models/User');
      User.find({ role: { $in: ['Admin', 'Manager'] } })
        .then(admins => {
          const adminEmails = admins.map(a => a.email);
          sendTaskStatusEmail(adminEmails, req.user.firstName || 'Employee', task.title, status);
        }).catch(err => console.error(err));
    }

    res.status(200).json({ message: 'Task status updated', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const task = await Task.findOne({ _id: taskId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    task.comments.push({
      user: req.user._id,
      userName: req.user.firstName || user.firstName,
      text: text,
    });
    
    await task.save();

    await AuditLog.create({
      action: 'TASK_COMMENT_ADDED',
      performedBy: req.user._id,
      performedByName: req.user.firstName || user.firstName,
      details: `Commented on task "${task.title}": "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
    });

    res.status(200).json({ message: "Comment added successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const task = await Task.findOne({ _id: taskId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const fileUrl = `/uploads/${req.file.filename}`;
    
    task.attachments.push({
      url: fileUrl,
      filename: req.file.originalname,
    });

    await task.save();
    res.status(200).json({ message: "Attachment uploaded successfully", task, attachment: task.attachments[task.attachments.length - 1] });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const LeaveRequest = require('../models/LeaveRequest');

exports.submitLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const leaveRequest = await LeaveRequest.create({
      employeeId: req.user._id,
      startDate,
      endDate,
      reason
    });
    
    await AuditLog.create({
      action: 'LEAVE_REQUEST_SUBMITTED',
      performedBy: req.user._id,
      performedByName: req.user.firstName || 'Employee',
      details: `Submitted leave request from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('adminTaskNotification', {
        message: `${req.user.firstName || 'An employee'} submitted a new leave request.`,
        status: 'Pending'
      });
    }

    res.status(201).json({ message: 'Leave request submitted', leaveRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ employeeId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
