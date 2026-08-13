const express = require('express');
const router  = express.Router();
const nc = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',             protect, nc.getNotifications);
router.put('/read-all',     protect, nc.markAllAsRead);
router.put('/:id/read',     protect, nc.markOneAsRead);
router.delete('/:id',       protect, nc.deleteNotification);

module.exports = router;
