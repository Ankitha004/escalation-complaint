const mongoose = require('mongoose');

const slaRuleSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
      unique: true,
    },
    timeLimitHours: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SlaRule', slaRuleSchema);
