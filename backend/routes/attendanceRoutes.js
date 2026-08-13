const express = require('express');
const router  = express.Router();
const ac = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/checkin',   protect, ac.checkIn);
router.post('/break',     protect, ac.handleBreak);
router.post('/checkout',  protect, ac.checkOut);
router.get('/today',      protect, ac.getTodayAttendance);
router.get('/calendar',   protect, ac.getCalendar);
router.get('/team',       protect, authorizeRoles('Admin', 'Manager'), ac.getTeamAttendance);

module.exports = router;
