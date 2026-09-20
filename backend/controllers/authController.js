const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const AuditLog = require('../models/AuditLog');
const Invite = require('../models/Invite');
const { sendPasswordResetEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const { firstName, email, password, inviteCode, department } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) return res.status(400).json({ message: 'User already exists with this email address' });

    let status = 'Approved';
    let assignedRole = 'Employee';
    let assignedDepartment = department || 'General';
    let validInvite = null;

    if (inviteCode) {
      validInvite = await Invite.findOne({
        token: inviteCode,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (validInvite && validInvite.usedCount < validInvite.usageLimit) {
        if (!validInvite.email || validInvite.email === email) {
            status = 'Approved';
            assignedRole = validInvite.role || 'Employee';
            assignedDepartment = validInvite.department || department || 'General';
        } else {
            validInvite = null;
        }
      } else {
          validInvite = null;
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

    if (status === 'Pending') {
      const JoinRequest = require('../models/JoinRequest');
      await JoinRequest.create({
        userId: user._id,
        status: 'Pending'
      });

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
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: cleanEmail })
      .select('+password +twoFactor.secret +twoFactor.recoveryCodes')
      .maxTimeMS(4000)
      .exec();

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.employmentStatus === 'Terminated') {
      return res.status(403).json({ message: 'Account deactivated. Please contact HR.' });
    }

    const isUser2FA = !!user.twoFactor?.enabled;

    if (isUser2FA) {
      const tempToken = jwt.sign(
        { id: user._id, stage: '2fa_required' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.status(200).json({
        require2FA: true,
        tempToken,
        email: user.email,
        message: 'Two-factor authentication code required'
      });
    }

    AuditLog.create({
      action: 'USER_LOGIN',
      performedBy: user._id,
      performedByName: user.firstName,
      details: 'Successful login'
    }).catch(err => console.warn('AuditLog background error:', err.message));

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    if (userObj.twoFactor) {
      delete userObj.twoFactor.secret;
      delete userObj.twoFactor.recoveryCodes;
    }

    return res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      user: userObj,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('teamId', 'name color')
      .populate('departmentId', 'name color');
    res.status(200).json(user);
  } catch (error) {
    console.error('GetMe Error:', error);
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
    console.error('UpdateProfile Error:', error);
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
    console.error('ForgotPassword Error:', error);
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

exports.loginVerify2FA = async (req, res) => {
  try {
    const { tempToken, code, isRecoveryCode } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ message: 'Verification token and code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: '2FA session expired. Please sign in again.' });
    }

    if (decoded.stage !== '2fa_required') {
      return res.status(401).json({ message: 'Invalid 2FA challenge' });
    }

    const user = await User.findById(decoded.id).select('+twoFactor.secret +twoFactor.recoveryCodes');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isRecoveryCode) {
      const cleanCode = code.trim().toUpperCase();
      const hashedCode = crypto.createHash('sha256').update(cleanCode).digest('hex');
      const codeIndex = (user.twoFactor?.recoveryCodes || []).indexOf(hashedCode);

      if (codeIndex === -1) {
        return res.status(400).json({ message: 'Invalid emergency backup recovery code' });
      }

      user.twoFactor.recoveryCodes.splice(codeIndex, 1);
      await user.save();

      AuditLog.create({
        action: '2FA_RECOVERY_CODE_USED',
        performedBy: user._id,
        performedByName: user.firstName,
        details: 'Authenticated using emergency backup recovery code'
      }).catch(err => console.warn('AuditLog error:', err.message));

      return res.json({
        _id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
        user,
        token: generateToken(user._id),
        recoveryCodesRemaining: user.twoFactor.recoveryCodes.length
      });
    }

    const cleanCode = code.toString().trim();
    const verified = speakeasy.totp.verify({
      secret: user.twoFactor?.secret,
      encoding: 'base32',
      token: cleanCode,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 6-digit verification code' });
    }

    AuditLog.create({
      action: '2FA_LOGIN_SUCCESS',
      performedBy: user._id,
      performedByName: user.firstName,
      details: 'Two-factor TOTP authentication verified successfully'
    }).catch(err => console.warn('AuditLog error:', err.message));

    return res.json({
      _id: user.id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      user,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('loginVerify2FA Error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
};

exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const secret = speakeasy.generateSecret({
      name: `TeamPulse (${user.email})`,
      issuer: 'TeamPulse',
      length: 20
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    user.twoFactor.secret = secret.base32;
    await user.save();

    res.json({
      secret: secret.base32,
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    console.error('setup2FA Error:', error);
    res.status(500).json({ message: 'Error initiating 2FA setup' });
  }
};

exports.confirm2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: '6-digit verification code is required' });
    }

    const user = await User.findById(req.user.id).select('+twoFactor.secret +twoFactor.recoveryCodes');
    if (!user || !user.twoFactor?.secret) {
      return res.status(400).json({ message: '2FA setup not initiated. Please generate a QR code first.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactor.secret,
      encoding: 'base32',
      token: code.toString().trim(),
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code. Check your authenticator app.' });
    }

    const rawRecoveryCodes = [];
    const hashedRecoveryCodes = [];
    for (let i = 0; i < 5; i++) {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const formattedCode = `${part1}-${part2}`;
      rawRecoveryCodes.push(formattedCode);
      hashedRecoveryCodes.push(crypto.createHash('sha256').update(formattedCode).digest('hex'));
    }

    user.twoFactor.enabled = true;
    user.twoFactor.recoveryCodes = hashedRecoveryCodes;
    await user.save();

    AuditLog.create({
      action: '2FA_ENABLED',
      performedBy: user._id,
      performedByName: user.firstName,
      details: 'User enabled Two-Factor Authentication'
    }).catch(err => console.warn('AuditLog error:', err.message));

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      recoveryCodes: rawRecoveryCodes
    });
  } catch (error) {
    console.error('confirm2FA Error:', error);
    res.status(500).json({ message: 'Error confirming 2FA' });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Current password is required to disable 2FA' });
    }

    const workspace = await Workspace.findOne({ isActive: true }) || await Workspace.findOne();
    if (workspace?.security?.enforce2FA) {
      return res.status(403).json({
        message: 'Organization security policy mandates Two-Factor Authentication. It cannot be disabled.'
      });
    }

    const user = await User.findById(req.user.id).select('+password +twoFactor.secret +twoFactor.recoveryCodes');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    user.twoFactor.enabled = false;
    user.twoFactor.secret = undefined;
    user.twoFactor.recoveryCodes = [];
    await user.save();

    AuditLog.create({
      action: '2FA_DISABLED',
      performedBy: user._id,
      performedByName: user.firstName,
      details: 'User disabled Two-Factor Authentication'
    }).catch(err => console.warn('AuditLog error:', err.message));

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('disable2FA Error:', error);
    res.status(500).json({ message: 'Error disabling 2FA' });
  }
};

exports.get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const workspace = await Workspace.findOne({ isActive: true }) || await Workspace.findOne();

    res.json({
      enabled: !!user?.twoFactor?.enabled,
      enforcedByWorkspace: !!workspace?.security?.enforce2FA
    });
  } catch (error) {
    console.error('get2FAStatus Error:', error);
    res.status(500).json({ message: 'Error retrieving 2FA status' });
  }
};

