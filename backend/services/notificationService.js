const Notification = require('../models/Notification');
const User = require('../models/User');

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

/**
 * Automatically notifies all Active HR and Super Admin users whenever a complaint is resolved
 */
const notifyHRAndSuperAdminOnResolution = async (complaint, resolverName = '') => {
  try {
    if (!complaint) return;
    const hrAndAdminUsers = await User.find({
      role: { $in: ['HR', 'Super Admin'] },
      status: 'Active'
    }).select('_id name role');

    const complaintRef = complaint.complaintId || complaint._id || 'Complaint';
    const subjectText = complaint.subject || complaint.title || '';
    const resolverText = resolverName ? ` by ${resolverName}` : '';
    const msg = `Complaint #${complaintRef} ("${subjectText}") has been resolved${resolverText}.`;

    for (const adminUser of hrAndAdminUsers) {
      await createNotification(adminUser._id, msg, complaint._id);
    }
  } catch (error) {
    console.error('Error notifying HR and Super Admin on resolution:', error);
  }
};

module.exports = {
  createNotification,
  notifyHRAndSuperAdminOnResolution,
};
