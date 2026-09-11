const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Urgent', 'Important', 'General'],
      default: 'General',
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Staff', 'Team Leaders', 'Department'],
      default: 'All',
    },
    department: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorRole: {
      type: String,
      default: 'Team Leader',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
