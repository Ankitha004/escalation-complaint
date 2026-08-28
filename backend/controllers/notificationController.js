const Notification = require('../models/Notification');

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read for the logged-in user
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification) {
      await notification.deleteOne();
      res.json({ message: 'Notification removed' });
    } else {
      res.status(404);
      throw new Error('Notification not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Broadcast announcement/notification to roles (Super Admin only)
// @route   POST /api/notifications/broadcast
// @access  Private (Super Admin)
const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, targetRole } = req.body;
    const User = require('../models/User');

    let query = { status: 'Active' };
    if (targetRole && targetRole !== 'All') {
      query.role = targetRole;
    }

    const targetUsers = await User.find(query);
    if (!targetUsers || targetUsers.length === 0) {
      return res.status(400).json({ message: 'No active users found for selected role' });
    }

    const notificationsToCreate = targetUsers.map(u => ({
      user: u._id,
      message: title ? `📢 [${title}]: ${message}` : `📢 ${message}`,
      type: 'broadcast',
      isRead: false
    }));

    await Notification.insertMany(notificationsToCreate);

    res.json({
      message: `Broadcast successfully sent to ${targetUsers.length} users (${targetRole || 'All'})`,
      count: targetUsers.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  broadcastNotification 
};
