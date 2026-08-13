const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// Create a notification (internal utility — used by other controllers)
exports.createNotification = async ({ recipient, type, title, body, link, metadata }) => {
  try {
    const notif = await Notification.create({ recipient, type, title, body: body || '', link: link || '', metadata: metadata || {} });
    return notif;
  } catch (err) {
    logger.error('createNotification error:', err);
  }
};

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip  = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({ notifications, unreadCount, page, limit });
  } catch (err) {
    logger.error('getNotifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/notifications/:id/read
exports.markOneAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
