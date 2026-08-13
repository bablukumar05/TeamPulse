const express = require('express');
const router  = express.Router();
const ai      = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/summarize-tasks', protect, ai.summarizeTasks);
router.post('/suggest-priority',protect, ai.suggestPriority);
router.post('/chat',            protect, ai.chat);
router.post('/generate-report', protect, ai.generateReport);

module.exports = router;
