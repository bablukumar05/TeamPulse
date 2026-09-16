const Attendance = require('../models/Attendance');

// Helper: get today's date at midnight in IST (UTC+5:30)
const todayIST = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + (330 * 60 * 1000));
  return new Date(Date.UTC(
    istTime.getUTCFullYear(),
    istTime.getUTCMonth(),
    istTime.getUTCDate()
  ));
};

// Helper: calculate IST hours, minutes, and whether check-in is after 9:30 AM IST
const getISTDetails = (date = new Date()) => {
  const totalUtcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const totalIstMinutes = (totalUtcMinutes + 330) % (24 * 60);
  const istHour24 = Math.floor(totalIstMinutes / 60);
  const istMinutes = totalIstMinutes % 60;

  const period = istHour24 >= 12 ? 'PM' : 'AM';
  const istHour12 = istHour24 % 12 || 12;
  const timeFormatted = `${String(istHour12).padStart(2, '0')}:${String(istMinutes).padStart(2, '0')} ${period}`;

  // Office start time: 9:30 AM IST (9 * 60 + 30 = 570 minutes from midnight)
  const officeStartMinutes = 9 * 60 + 30; // 570
  const isLate = totalIstMinutes > officeStartMinutes;
  const lateMinutes = isLate ? (totalIstMinutes - officeStartMinutes) : 0;

  const lateDurationFormatted = lateMinutes >= 60
    ? `${Math.floor(lateMinutes / 60)}h ${lateMinutes % 60}m`
    : `${lateMinutes}m`;

  return {
    totalIstMinutes,
    istHour24,
    istMinutes,
    timeFormatted,
    isLate,
    lateMinutes,
    lateDurationFormatted
  };
};

// POST /api/attendance/checkin
exports.checkIn = async (req, res) => {
  try {
    const today = todayIST();
    const existing = await Attendance.findOne({ user: req.user._id, date: today });
    if (existing && existing.checkInTime) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    const now = new Date();
    const timing = getISTDetails(now);

    const lateNote = timing.isLate
      ? `Late check-in at ${timing.timeFormatted} (${timing.lateDurationFormatted} late)`
      : `On-time check-in at ${timing.timeFormatted}`;

    const record = await Attendance.findOneAndUpdate(
      { user: req.user._id, date: today },
      {
        $set: {
          checkInTime: now,
          status: timing.isLate ? 'Late' : 'Present',
          isLate: timing.isLate,
          lateMinutes: timing.lateMinutes,
          notes: lateNote,
        }
      },
      { upsert: true, new: true }
    );

    const message = timing.isLate
      ? `Checked in (Late by ${timing.lateDurationFormatted} at ${timing.timeFormatted})`
      : `Checked in on-time at ${timing.timeFormatted} ✅`;

    console.log(`Check-in: ${req.user.firstName} at ${now.toISOString()} [${timing.timeFormatted}], isLate=${timing.isLate}, lateMinutes=${timing.lateMinutes}`);
    res.json({
      message,
      record,
      checkInTimeFormatted: timing.timeFormatted,
      isLate: timing.isLate,
      lateMinutes: timing.lateMinutes
    });
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
    const isAllMonths = req.query.month === 'all';
    const month = req.query.month !== undefined && req.query.month !== '' && !isAllMonths
      ? parseInt(req.query.month, 10)
      : new Date().getMonth();
    const year = req.query.year !== undefined && req.query.year !== ''
      ? parseInt(req.query.year, 10)
      : new Date().getFullYear();

    let startDate, endDate;
    if (isAllMonths) {
      startDate = new Date(Date.UTC(year, 0, 1));
      endDate   = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    } else {
      startDate = new Date(Date.UTC(year, month, 1));
      endDate   = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    }

    const records = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/attendance/yearly?userId=&year=
exports.getYearlyAttendance = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    const year = req.query.year !== undefined && req.query.year !== ''
      ? parseInt(req.query.year, 10)
      : new Date().getFullYear();

    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate   = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const records = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const monthlySummary = Array.from({ length: 12 }, (_, m) => ({
      month: m,
      totalRecords: 0,
      present: 0,
      late: 0,
      absent: 0,
      wfh: 0,
      leave: 0,
      halfDay: 0,
      holiday: 0,
      totalWorkMinutes: 0,
      records: []
    }));

    records.forEach(r => {
      const d = new Date(r.date);
      const m = d.getUTCMonth();
      if (m >= 0 && m < 12) {
        monthlySummary[m].totalRecords += 1;
        monthlySummary[m].records.push(r);
        if (r.status === 'Present') monthlySummary[m].present += 1;
        if (r.isLate) monthlySummary[m].late += 1;
        if (r.status === 'Absent') monthlySummary[m].absent += 1;
        if (r.status === 'WFH') monthlySummary[m].wfh += 1;
        if (r.status === 'On Leave') monthlySummary[m].leave += 1;
        if (r.status === 'Half-Day') monthlySummary[m].halfDay += 1;
        if (r.status === 'Holiday') monthlySummary[m].holiday += 1;
        monthlySummary[m].totalWorkMinutes += (r.totalWorkMinutes || 0);
      }
    });

    res.json({
      year,
      records,
      monthlySummary,
    });
  } catch (err) {
    console.error('getYearlyAttendance error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
