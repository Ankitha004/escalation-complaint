const Notification = require('../models/Notification');

const createNotification = async (userId, message, relatedComplaintId = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      relatedComplaint: relatedComplaintId,
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  createNotification,
};
