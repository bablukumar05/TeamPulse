const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const employeeController = require('../controllers/employeeController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.get('/employees', protect, authorizeRoles('Admin', 'Manager'), adminController.getEmployees);
router.post('/tasks', protect, authorizeRoles('Admin', 'Manager'), adminController.createTask);
router.get('/tasks/all', protect, authorizeRoles('Admin', 'Manager'), adminController.getAllTasks);
router.put('/tasks/:taskId/status', protect, authorizeRoles('Admin', 'Manager'), adminController.updateTaskStatusAdmin);
router.put('/tasks/:taskId/details', protect, authorizeRoles('Admin', 'Manager'), adminController.updateTaskDetailsAdmin);
// Admin can also comment on and upload attachments to any task
router.post('/tasks/:taskId/comment', protect, authorizeRoles('Admin', 'Manager'), employeeController.addComment);
router.post('/tasks/:taskId/upload', protect, authorizeRoles('Admin', 'Manager'), upload.single('file'), employeeController.uploadAttachment);
router.get('/audit', protect, authorizeRoles('Admin', 'Manager'), adminController.getAuditLogs);
router.put('/employees/:id', protect, authorizeRoles('Admin'), adminController.updateEmployee);
router.get('/leave-requests', protect, authorizeRoles('Admin', 'Manager'), adminController.getAllLeaveRequests);
router.put('/leave-requests/:id/status', protect, authorizeRoles('Admin', 'Manager'), adminController.updateLeaveStatus);

router.get('/join-requests', protect, authorizeRoles('Admin', 'Manager'), adminController.getJoinRequests);
router.put('/join-requests/:id/approve', protect, authorizeRoles('Admin', 'Manager'), adminController.approveJoinRequest);

router.get('/employees/terminated', protect, authorizeRoles('Admin', 'Manager'), adminController.getTerminatedEmployees);
router.put('/employees/:id/terminate', protect, authorizeRoles('Admin', 'Manager'), adminController.terminateEmployee);
router.put('/employees/:id/restore', protect, authorizeRoles('Admin', 'Manager'), adminController.restoreEmployee);

module.exports = router;
