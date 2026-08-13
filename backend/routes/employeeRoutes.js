const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.get('/tasks', protect, employeeController.getTasks);
router.put('/tasks/:taskId/status', protect, employeeController.updateTaskStatus);
router.put('/tasks/:taskId/details', protect, employeeController.updateTaskDetails);
router.post('/tasks/:taskId/comment', protect, employeeController.addComment);
router.post('/tasks/:taskId/upload', protect, upload.single('file'), employeeController.uploadAttachment);

router.post('/leave-request', protect, employeeController.submitLeaveRequest);
router.get('/leave-requests', protect, employeeController.getMyLeaveRequests);

router.get('/projects', protect, employeeController.getMyProjects);

module.exports = router;
