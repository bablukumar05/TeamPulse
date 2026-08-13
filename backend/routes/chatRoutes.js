const express = require('express');
const router  = express.Router();
const cc      = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

// Legacy route support (for old global chat)
router.get('/legacy', protect, async (req, res) => {
  const Message = require('../models/Message');
  try {
    const messages = await Message.find({ room: null, isDeleted: false }).sort({ createdAt: 1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rooms
router.get('/rooms',                 protect, cc.getMyRooms);
router.post('/rooms',                protect, cc.createRoom);
router.get('/dm/:targetUserId',       protect, cc.getOrCreateDMRoom);

// Messages
router.get('/rooms/:roomId/messages', protect, cc.getRoomMessages);
router.post('/rooms/:roomId/messages',protect, uploadMiddleware.array('attachments', 5), cc.sendMessage);
router.put('/messages/:id',          protect, cc.editMessage);
router.delete('/messages/:id',       protect, cc.deleteMessage);
router.post('/messages/:id/react',   protect, cc.toggleReaction);

module.exports = router;
