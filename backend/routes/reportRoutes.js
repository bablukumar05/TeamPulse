const express = require('express');
const router  = express.Router();
const rc      = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/productivity', protect, rc.getProductivityReport);
router.get('/attendance',   protect, rc.getAttendanceReport);
router.get('/sprints',      protect, rc.getSprintReport);
router.get('/leaves',       protect, rc.getLeaveReport);

module.exports = router;
