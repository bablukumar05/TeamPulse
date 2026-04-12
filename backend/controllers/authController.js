const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendPasswordResetEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const { firstName, email, password, inviteCode, skills } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    let isApproved = false;
    if (inviteCode === 'TEAM123' || email.endsWith('@teampulse.com')) {
      isApproved = true;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      email,
      password: hashedPassword,
      role: 'Employee',
      isApproved,
      inviteCodeUsed: inviteCode
    });

    // Create JoinRequest if not auto-approved
    if (!isApproved) {
      const JoinRequest = require('../models/JoinRequest');
      await JoinRequest.create({
        userId: user._id,
        skills: skills ? skills.split(',').map(s => s.trim()) : [],
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
      isApproved: user.isApproved,
      token: generateToken(user._id),
      message: isApproved ? 'Registration successful and approved' : 'Registration successful, pending admin approval'
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
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
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
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
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'No account with that email found' });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Try to grab origin to dynamically build link
    const resetUrl = `${req.headers.origin || 'http://localhost:5173'}/?resetToken=${resetToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
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
