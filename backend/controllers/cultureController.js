const Kudo = require('../models/Kudo');
const Announcement = require('../models/Announcement');
const User = require('../models/User');

// @desc    Get all kudos
// @route   GET /api/culture/kudos
// @access  Private
const getKudos = async (req, res) => {
  try {
    const kudos = await Kudo.find()
      .populate('sender', 'firstName avatar')
      .populate('receiver', 'firstName avatar')
      .sort({ createdAt: -1 });
    res.status(200).json(kudos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching kudos' });
  }
};

// @desc    Create a new kudo
// @route   POST /api/culture/kudos
// @access  Private
const createKudo = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Please provide receiver and message' });
    }

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot send a kudo to yourself' });
    }

    const kudo = await Kudo.create({
      sender: req.user._id,
      receiver: receiverId,
      message,
    });

    // Increment receiver's XP by 10 points
    const receiver = await User.findById(receiverId);
    if (receiver) {
      receiver.xp += 10;
      await receiver.save();
    }

    const populatedKudo = await Kudo.findById(kudo._id)
      .populate('sender', 'firstName avatar')
      .populate('receiver', 'firstName avatar');

    res.status(201).json(populatedKudo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating kudo' });
  }
};

// @desc    Get all announcements
// @route   GET /api/culture/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('author', 'firstName avatar')
      .sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
};

// @desc    Create an announcement
// @route   POST /api/culture/announcements
// @access  Private (Admin/Manager)
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Please provide title and content' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority: priority || 'Normal',
      author: req.user._id
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'firstName avatar');

    res.status(201).json(populatedAnnouncement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating announcement' });
  }
};

// @desc    Get leaderboard
// @route   GET /api/culture/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'Employee' })
      .select('firstName avatar xp badges team')
      .sort({ xp: -1 })
      .limit(10);
      
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
};

module.exports = {
  getKudos,
  createKudo,
  getAnnouncements,
  createAnnouncement,
  getLeaderboard
};
