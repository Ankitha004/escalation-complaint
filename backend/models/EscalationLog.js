const mongoose = require('mongoose');

const escalationLogSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
    },
    complaintRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
    },
    staffId: {
      type: String,
      default: '',
    },
    teamLeader: {
      type: String,
      default: '',
    },
    manager: {
      type: String,
      default: 'Manager',
    },
    priority: {
      type: String,
      default: 'Medium',
    },
    escalatedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: 'Complaint exceeded SLA threshold',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EscalationLog', escalationLogSchema);
