const ChatRoom     = require('../models/ChatRoom');
const Message      = require('../models/Message');
const User         = require('../models/User');
const Notification = require('../models/Notification');

// ── Rooms ──────────────────────────────────────────────────────────────────

// GET /api/chat/rooms — List my rooms
exports.getMyRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user._id,
      isArchived: false
    })
    .populate('participants', 'firstName lastName avatar isOnline lastSeen role department')
    .populate('project', 'name color')
    .populate('department', 'name color')
    .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (err) {
    console.error('getMyRooms error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/chat/rooms — Create Group/Project/Department room
exports.createRoom = async (req, res) => {
  try {
    const { type, name, participants, projectId, departmentId } = req.body;

    if (!type) return res.status(400).json({ message: 'Type is required' });

    let roomParticipants = Array.isArray(participants) ? [...participants] : [];
    if (!roomParticipants.includes(req.user._id.toString())) {
      roomParticipants.push(req.user._id.toString());
    }

    const room = await ChatRoom.create({
      type,
      name: name || `${type} Room`,
      participants: roomParticipants,
      project: projectId || null,
      department: departmentId || null,
      createdBy: req.user._id,
    });

    const populated = await ChatRoom.findById(room._id)
      .populate('participants', 'firstName lastName avatar isOnline lastSeen role department')
      .populate('project', 'name color')
      .populate('department', 'name color');

    console.log(`Chat room created: ${room.name} (${type})`);
    res.status(201).json(populated);
  } catch (err) {
    console.error('createRoom error:', err);
    res.status(500).json({ message: 'Failed to create room', error: err.message });
  }
};

// GET /api/chat/dm/:targetUserId — Get or create DM room with another user
exports.getOrCreateDMRoom = async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    if (!targetUserId) return res.status(400).json({ message: 'Target user ID is required' });

    let room = await ChatRoom.findOne({
      type: 'DM',
      participants: { $all: [req.user._id, targetUserId], $size: 2 }
    })
    .populate('participants', 'firstName lastName avatar isOnline lastSeen role department');

    if (!room) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) return res.status(404).json({ message: 'User not found' });

      room = await ChatRoom.create({
        type: 'DM',
        name: `${req.user.firstName} & ${targetUser.firstName}`,
        participants: [req.user._id, targetUserId],
        createdBy: req.user._id,
      });

      room = await ChatRoom.findById(room._id)
        .populate('participants', 'firstName lastName avatar isOnline lastSeen role department');
    }

    res.json(room);
  } catch (err) {
    console.error('getOrCreateDMRoom error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Messages ──────────────────────────────────────────────────────────────

// GET /api/chat/rooms/:roomId/messages — Paginated messages
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const messages = await Message.find({ room: roomId, isDeleted: false })
      .populate('senderId', 'firstName lastName avatar role')
      .populate('parentMessage')
      .populate('mentions', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
  } catch (err) {
    console.error('getRoomMessages error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/chat/rooms/:roomId/messages — Send message
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, parentMessageId, mentions } = req.body;

    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Message text or attachment is required' });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Handle file attachments if present
    const attachments = (req.files || []).map(f => ({
      url: `/uploads/${f.filename}`,
      filename: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
    }));

    const message = await Message.create({
      room: roomId,
      senderId: req.user._id,
      senderName: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
      senderRole: req.user.role,
      text: text || '',
      parentMessage: parentMessageId || null,
      attachments,
      mentions: Array.isArray(mentions) ? mentions : [],
    });

    // Update room lastMessage
    room.lastMessage = {
      text: text || 'Sent an attachment',
      senderId: req.user._id,
      sentAt: new Date(),
    };
    await room.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'firstName lastName avatar role')
      .populate('parentMessage')
      .populate('mentions', 'firstName lastName');

    // Notify mentioned users
    if (Array.isArray(mentions) && mentions.length > 0) {
      for (const mId of mentions) {
        if (mId.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: mId,
            type: 'mention_in_chat',
            title: `Mentioned by ${req.user.firstName}`,
            body: text.substring(0, 100),
            link: `/chat?roomId=${roomId}`,
          }).catch(e => console.error('Mention notification fail:', e));
        }
      }
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};

// PUT /api/chat/messages/:id — Edit message
exports.editMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot edit someone else message' });
    }

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'firstName lastName avatar role')
      .populate('parentMessage');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/chat/messages/:id — Soft delete message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.senderId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    message.isDeleted = true;
    message.text = 'This message was deleted';
    await message.save();

    res.json({ message: 'Message deleted', id: message._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/chat/messages/:id/react — Add/remove emoji reaction
exports.toggleReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'Emoji is required' });

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    let reactionGroup = message.reactions.find(r => r.emoji === emoji);

    if (reactionGroup) {
      const userIndex = reactionGroup.users.indexOf(req.user._id);
      if (userIndex > -1) {
        reactionGroup.users.splice(userIndex, 1);
        if (reactionGroup.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        reactionGroup.users.push(req.user._id);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'firstName lastName avatar role')
      .populate('parentMessage');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
