const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .sort({ pinned: -1, createdAt: -1 })
      .populate('createdBy', 'name email role department');

    res.json(announcements);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (Team Leader, HR, Manager, Super Admin)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority, targetAudience, department, pinned } = req.body;

    if (!title || !content) {
      res.status(400);
      throw new Error('Title and content are required');
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority: priority || 'General',
      targetAudience: targetAudience || 'All',
      department: department || req.user.department || '',
      createdBy: req.user._id,
      authorName: req.user.name || 'Management',
      authorRole: req.user.role || 'Team Leader',
      pinned: pinned || false,
      acknowledgedBy: [req.user._id],
    });

    // Send notification alerts to target users
    try {
      let query = { _id: { $ne: req.user._id }, status: 'Active' };
      if (targetAudience === 'Staff') {
        query.role = 'Staff';
      } else if (targetAudience === 'Team Leaders') {
        query.role = 'Team Leader';
      } else if (targetAudience === 'Department' && (department || req.user.department)) {
        query.department = department || req.user.department;
      }

      const targetUsers = await User.find(query).select('_id');
      if (targetUsers.length > 0) {
        const notifs = targetUsers.map(u => ({
          user: u._id,
          message: `📢 [Announcement - ${announcement.priority}]: ${title}`,
          type: 'broadcast',
          isRead: false
        }));
        await Notification.insertMany(notifs);
      }
    } catch (notifErr) {
      console.warn('Failed to send announcement notifications:', notifErr);
    }

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pinned status of an announcement
// @route   PUT /api/announcements/:id/pin
// @access  Private (Team Leader, HR, Manager, Super Admin)
const togglePinAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      res.status(404);
      throw new Error('Announcement not found');
    }

    announcement.pinned = !announcement.pinned;
    await announcement.save();

    res.json(announcement);
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge/read an announcement
// @route   PUT /api/announcements/:id/acknowledge
// @access  Private
const acknowledgeAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      res.status(404);
      throw new Error('Announcement not found');
    }

    const userIdStr = req.user._id.toString();
    const alreadyAcked = announcement.acknowledgedBy.some(id => id.toString() === userIdStr);

    if (!alreadyAcked) {
      announcement.acknowledgedBy.push(req.user._id);
      await announcement.save();
    }

    res.json(announcement);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      res.status(404);
      throw new Error('Announcement not found');
    }

    // Allow author or high-level roles to delete
    const isAuthor = announcement.createdBy.toString() === req.user._id.toString();
    const isAuthorized = ['Super Admin', 'HR', 'Manager', 'Team Leader'].includes(req.user.role);

    if (!isAuthor && !isAuthorized) {
      res.status(403);
      throw new Error('Not authorized to delete this announcement');
    }

    await announcement.deleteOne();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  togglePinAnnouncement,
  acknowledgeAnnouncement,
  deleteAnnouncement,
};
