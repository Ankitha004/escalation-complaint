const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const rawNotifications = await Notification.find({ user: req.user._id })
      .populate('relatedComplaint')
      .sort({ createdAt: -1 })
      .limit(100);

    const validNotifications = [];
    const orphanIds = [];

    for (let notif of rawNotifications) {
      if (notif.relatedComplaint) {
        validNotifications.push(notif);
      } else {
        const match = notif.message ? notif.message.match(/CMP\d+/i) : null;
        if (match) {
          const compIdStr = match[0].toUpperCase();
          const compExists = await Complaint.exists({ complaintId: compIdStr });
          if (compExists) {
            validNotifications.push(notif);
          } else {
            orphanIds.push(notif._id);
          }
        } else if (notif.type === 'broadcast' || !notif.message?.toLowerCase().includes('complaint')) {
          validNotifications.push(notif);
        } else {
          orphanIds.push(notif._id);
        }
      }
    }

    if (orphanIds.length > 0) {
      await Notification.deleteMany({ _id: { $in: orphanIds } });
    }

    res.json(validNotifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications for the logged-in user
// @route   DELETE /api/notifications/clear-all
// @access  Private
const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification) {
      notification.isRead = true;
      await notification.save();
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404);
      throw new Error('Notification not found');
    }
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
  clearAllNotifications,
  broadcastNotification 
};
