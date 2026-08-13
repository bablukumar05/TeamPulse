const express  = require('express');
const router   = express.Router();
const hr       = require('../controllers/hrController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

const adminManager = ['Admin', 'Manager'];

router.get('/stats',                           protect, authorizeRoles(...adminManager), hr.getHRStats);
router.get('/employees',                       protect, authorizeRoles(...adminManager), hr.getEmployees);
router.get('/employees/:id',                   protect, hr.getEmployeeProfile);
router.put('/employees/:id',                   protect, authorizeRoles(...adminManager), hr.updateEmployee);
router.post('/employees/:id/documents',        protect, authorizeRoles(...adminManager), uploadMiddleware.single('document'), hr.uploadDocument);
router.delete('/employees/:id/documents/:docIndex', protect, authorizeRoles(...adminManager), hr.deleteDocument);
router.get('/leave-requests',                  protect, authorizeRoles(...adminManager), hr.getLeaveRequests);
router.put('/leave-requests/:id',              protect, authorizeRoles(...adminManager), hr.updateLeaveStatus);
router.get('/attendance/report',               protect, authorizeRoles(...adminManager), hr.getAttendanceReport);

module.exports = router;
