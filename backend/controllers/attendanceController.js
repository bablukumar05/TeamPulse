const Attendance = require('../models/Attendance');

// Helper: get today's date at midnight UTC+5:30
const todayIST = () => {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
};

// POST /api/attendance/checkin
exports.checkIn = async (req, res) => {
  try {
    const today = todayIST();
    const existing = await Attendance.findOne({ user: req.user._id, date: today });
    if (existing && existing.checkInTime) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    // Determine if late (after 9:30 AM IST)
    const now = new Date();
    const istHour   = (now.getUTCHours() + 5) % 24;
    const istMinute = (now.getUTCMinutes() + 30) % 60;
    const isLate = istHour > 9 || (istHour === 9 && istMinute > 30);

    const record = await Attendance.findOneAndUpdate(
      { user: req.user._id, date: today },
      {
        $set: {
          checkInTime: now,
          status: isLate ? 'Late' : 'Present',
          isLate,
        }
      },
      { upsert: true, new: true }
    );

    console.log(`Check-in: ${req.user.firstName} at ${now.toISOString()} isLate=${isLate}`);
    res.json({ message: `Checked in${isLate ? ' (Late)' : ''}`, record });
  } catch (err) {
    console.error('checkIn error:', err);
    res.status(500).json({ message: 'Failed to check in', error: err.message });
  }
};

// POST /api/attendance/break  { action: 'start' | 'end' }
exports.handleBreak = async (req, res) => {
  try {
    const { action } = req.body;
    const today = todayIST();
    const record = await Attendance.findOne({ user: req.user._id, date: today });
    if (!record || !record.checkInTime) {
      return res.status(400).json({ message: 'You have not checked in yet' });
    }

    const now = new Date();
    if (action === 'start') {
      record.breaks.push({ startTime: now });
    } else if (action === 'end') {
      const activeBreak = record.breaks.find(b => !b.endTime);
      if (!activeBreak) return res.status(400).json({ message: 'No active break to end' });
      activeBreak.endTime = now;
      activeBreak.durationMinutes = Math.round((now - activeBreak.startTime) / 60000);
    }

    record.totalBreakMinutes = record.breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
    await record.save();
    res.json({ message: action === 'start' ? 'Break started' : 'Break ended', record });
  } catch (err) {
    console.error('handleBreak error:', err);
    res.status(500).json({ message: 'Failed to update break', error: err.message });
  }
};

// POST /api/attendance/checkout
exports.checkOut = async (req, res) => {
  try {
    const today = todayIST();
    const record = await Attendance.findOne({ user: req.user._id, date: today });
    if (!record || !record.checkInTime) {
      return res.status(400).json({ message: 'You have not checked in yet' });
    }
    if (record.checkOutTime) {
      return res.status(400).json({ message: 'Already checked out for today' });
    }

    // End any open break
    const activeBreak = record.breaks.find(b => !b.endTime);
    if (activeBreak) {
      activeBreak.endTime = new Date();
      activeBreak.durationMinutes = Math.round((activeBreak.endTime - activeBreak.startTime) / 60000);
    }

    record.checkOutTime = new Date();
    record.totalBreakMinutes = record.breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
    record.totalWorkMinutes  = Math.round((record.checkOutTime - record.checkInTime) / 60000) - record.totalBreakMinutes;

    // Overtime: more than 9 hours (540 minutes)
    record.isOvertime = record.totalWorkMinutes > 540;

    await record.save();
    console.log(`Check-out: ${req.user.firstName} — ${record.totalWorkMinutes}min worked`);
    res.json({ message: 'Checked out successfully', record });
  } catch (err) {
    console.error('checkOut error:', err);
    res.status(500).json({ message: 'Failed to check out', error: err.message });
  }
};

// GET /api/attendance/today
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = todayIST();
    const record = await Attendance.findOne({ user: req.user._id, date: today });
    res.json(record || { status: 'Not Checked In', checkInTime: null });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/attendance/calendar?userId=&month=&year=
exports.getCalendar = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    const month  = parseInt(req.query.month) || new Date().getMonth();
    const year   = parseInt(req.query.year)  || new Date().getFullYear();

    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate   = new Date(Date.UTC(year, month + 1, 0));

    const records = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/attendance/team?month=&year=
exports.getTeamAttendance = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth();
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const User = require('../models/User');
    const teamMembers = await User.find({ employmentStatus: 'Active' }).select('_id firstName lastName avatar department');

    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate   = new Date(Date.UTC(year, month + 1, 0));

    const records = await Attendance.find({ date: { $gte: startDate, $lte: endDate } })
      .populate('user', 'firstName lastName avatar department');

    res.json({ members: teamMembers, records });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
