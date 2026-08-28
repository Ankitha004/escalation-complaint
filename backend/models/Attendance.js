const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clockIn: {
      type: String,
      required: true,
    },
    clockOut: {
      type: String,
      default: 'In Progress',
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Absent'],
      default: 'Present',
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
