const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/metrics', systemController.getSystemMetrics);
router.post('/cache/clear', protect, authorizeRoles('Admin'), systemController.clearCache);

module.exports = router;
