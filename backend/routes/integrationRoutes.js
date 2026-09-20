const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/github/webhook', integrationController.handleGitHubWebhook);
router.post('/gitlab/webhook', integrationController.handleGitLabWebhook);
router.post('/slack/actions', integrationController.handleSlackInteractions);
router.get('/calendar/feed/:token', integrationController.getCalendarFeed);

router.get('/settings', protect, authorizeRoles('Admin', 'Team Leader'), integrationController.getIntegrationSettings);
router.put('/settings', protect, authorizeRoles('Admin'), integrationController.updateIntegrationSettings);
router.post('/slack/test', protect, authorizeRoles('Admin'), integrationController.testSlackWebhook);

module.exports = router;
