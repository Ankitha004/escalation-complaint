const Complaint = require('../models/Complaint');
const EscalationLog = require('../models/EscalationLog');

// @desc    Get all escalated complaints & escalation logs
// @route   GET /api/escalations
// @access  Private (Manager, Admin, HR)
const getEscalations = async (req, res, next) => {
  try {
    const [escalatedComplaints, logs] = await Promise.all([
      Complaint.find({ $or: [{ escalated: true }, { status: 'Escalated' }] }).sort({ updatedAt: -1 }),
      EscalationLog.find({}).sort({ createdAt: -1 })
    ]);

    res.json({
      complaints: escalatedComplaints,
      logs,
      count: escalatedComplaints.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEscalations
};
