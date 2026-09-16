const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending Approval', 'Pending Team Leader Approval', 'Approved', 'Rejected'],
      default: 'Pending Approval',
    },
    isEmergencyLeave: {
      type: Boolean,
      default: false,
    },
    deductionDays: {
      type: Number,
      default: 0,
    },
    salaryDeductionAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);
