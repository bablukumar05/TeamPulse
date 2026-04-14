const express = require('express');
const router = express.Router();
const { 
  getKudos, 
  createKudo, 
  getAnnouncements, 
  createAnnouncement, 
  getLeaderboard 
} = require('../controllers/cultureController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/kudos', protect, getKudos);
router.post('/kudos', protect, createKudo);

router.get('/announcements', protect, getAnnouncements);
router.post('/announcements', protect, authorizeRoles('Admin', 'Manager'), createAnnouncement);

router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
