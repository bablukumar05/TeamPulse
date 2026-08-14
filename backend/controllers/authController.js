const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Invite = require('../models/Invite');
const { sendPasswordResetEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const { firstName, email, password, inviteCode, skills, tenthMarks, twelfthMarks, graduationDegree, postGraduationDegree } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    let status = 'Pending';
    let assignedRole = 'Employee';
    let assignedDepartment = 'General';
    let validInvite = null;

    if (inviteCode) {
      // Find valid invite
      validInvite = await Invite.findOne({
        token: inviteCode,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (validInvite && validInvite.usedCount < validInvite.usageLimit) {
        if (!validInvite.email || validInvite.email === email) {
            status = 'Approved';
            assignedRole = validInvite.role;
            assignedDepartment = validInvite.department || 'General';
        } else {
            validInvite = null; // Email mismatch
        }
      } else {
          validInvite = null;
      }
    }
    
    // Auto-approve generic email domains or standard registrations
    if (!validInvite) {
      status = 'Approved'; // Allow direct signup for instant employee access
    }

    if (tenthMarks || twelfthMarks) {
      const tenth = parseFloat(tenthMarks) || 0;
      const twelfth = parseFloat(twelfthMarks) || 0;
      if ((tenth > 0 && tenth < 60) || (twelfth > 0 && twelfth < 60)) {
        return res.status(400).json({ message: 'Eligibility Criteria Not Met: 10th and 12th marks must be at least 60%.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      email,
      password: hashedPassword,
      role: assignedRole,
      department: assignedDepartment,
      status: status,
      inviteCodeUsed: validInvite ? validInvite.token : null
    });

    if (validInvite) {
      validInvite.usedCount += 1;
      if (validInvite.usedCount >= validInvite.usageLimit) {
        validInvite.isActive = false;
      }
      await validInvite.save();
    }

    // Create JoinRequest if not auto-approved
    if (status === 'Pending') {
      const JoinRequest = require('../models/JoinRequest');
      await JoinRequest.create({
        userId: user._id,
        skills: skills ? skills.split(',').map(s => s.trim()) : [],
        tenthMarks: parseFloat(tenthMarks) || 0,
        twelfthMarks: parseFloat(twelfthMarks) || 0,
        graduationDegree: graduationDegree || '',
        postGraduationDegree: postGraduationDegree || '',
        resumeUrl: req.file ? `/uploads/${req.file.filename}` : '',
        status: 'Pending'
      });

      // Notify Admins
      const io = req.app.get('io');
      if (io) {
        io.to('admins').emit('adminTaskNotification', { message: `New join request from ${firstName}`, status: 'Pending' });
      }
    }

    res.status(201).json({
      _id: user.id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      status: user.status,
      user,
      token: generateToken(user._id),
      message: status === 'Approved' ? 'Registration successful and approved' : 'Registration successful, pending admin approval'
    });
  } catch (error) {
    logger.error('Register Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.employmentStatus === 'Terminated') {
        return res.status(403).json({ message: 'Account deactivated. Please contact HR.' });
      }

      await AuditLog.create({
        action: 'USER_LOGIN',
        performedBy: user._id,
        performedByName: user.firstName,
        details: `Successful login`
      });

      res.json({
        _id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
        user,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    logger.error('GetMe Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await user.save();

    await AuditLog.create({
      action: 'PROFILE_UPDATED',
      performedBy: user._id,
      performedByName: user.firstName,
      details: `User updated profile settings`
    });

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      email: updatedUser.email,
      role: updatedUser.role,
      team: updatedUser.team,
      avatar: updatedUser.avatar,
    });
  } catch (error) {
    logger.error('UpdateProfile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'No account with that email found' });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendBase = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBase}/?resetToken=${resetToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    logger.error('ForgotPassword Error:', error);
    res.status(500).json({ message: 'Email could not be sent' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_RESET',
      performedBy: user._id,
      performedByName: user.firstName,
      details: 'User completely reset their password via token recovery'
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
