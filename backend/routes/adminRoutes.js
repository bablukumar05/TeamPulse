const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/employees', protect, authorizeRoles('Admin', 'Manager'), adminController.getEmployees);
router.post('/tasks', protect, authorizeRoles('Admin', 'Manager'), adminController.createTask);
router.get('/tasks/all', protect, authorizeRoles('Admin', 'Manager'), adminController.getAllTasks);
router.put('/tasks/:taskId/status', protect, authorizeRoles('Admin', 'Manager'), adminController.updateTaskStatusAdmin);
router.get('/audit', protect, authorizeRoles('Admin', 'Manager'), adminController.getAuditLogs);
router.put('/employees/:id', protect, authorizeRoles('Admin'), adminController.updateEmployee);
router.get('/leave-requests', protect, authorizeRoles('Admin', 'Manager'), adminController.getAllLeaveRequests);
router.put('/leave-requests/:id/status', protect, authorizeRoles('Admin', 'Manager'), adminController.updateLeaveStatus);

router.get('/join-requests', protect, authorizeRoles('Admin', 'Manager'), adminController.getJoinRequests);
router.put('/join-requests/:id/approve', protect, authorizeRoles('Admin', 'Manager'), adminController.approveJoinRequest);

module.exports = router;
