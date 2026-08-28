const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedByName: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    staffId: {
      type: String,
      required: true,
    },
    staffName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      default: 'Staff',
    },
    // Legacy fields (kept for backward compatibility during migration)
    teamLeader: {
      type: String,
      default: 'Unassigned',
    },
    targetDepartment: {
      type: String,
    },
    // New Normalized Fields
    assignedTeamLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    responsibleDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    departmentManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Submitted', 'In Progress', 'Waiting on User', 'Resolved', 'Approved', 'Closed', 'Rejected', 'Escalated', 'Cancelled', 'Pending HR Review'],
      default: 'Pending',
    },
    attachments: [
      {
        type: String,
      },
    ],
    timeline: [timelineSchema],
    comments: [commentSchema],
    escalated: {
      type: Boolean,
      default: false,
    },
    escalatedToSuperAdmin: {
      type: Boolean,
      default: false,
    },
    escalationLevel: {
      type: Number,
      default: 0,
    },
    slaPausedAt: {
      type: Date,
    },
    totalPausedDuration: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedDate: {
      type: Date,
    },
    closedDate: {
      type: Date,
    },
    feedbackRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedbackComment: {
      type: String,
    },
    resolutionReports: [
      {
        solvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        solverName: String,
        solverRole: String,
        reportText: String,
        forwardedTo: String, // 'Manager' or 'HR'
        isReviewed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
