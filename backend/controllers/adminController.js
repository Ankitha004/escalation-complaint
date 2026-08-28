const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');

// @desc    Get global stats for Super Admin
// @route   GET /api/admin/stats
// @access  Private (Super Admin)
const getGlobalStats = async (req, res, next) => {
  try {
    const complaints = await Complaint.find();
    
    const totalComplaints = complaints.length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Approved').length;
    const escalated = complaints.filter(c => c.status === 'Escalated' || c.escalated === true || c.escalatedToSuperAdmin === true).length;
    const pending = complaints.filter(c => c.status === 'Pending' || c.status === 'Submitted').length;

    // Get all TLs for performance tracking
    const teamLeaders = await User.find({ role: 'Team Leader' });
    const departments = await Department.find();
    const staff = await User.find({ role: 'Staff' });
    
    res.json({
      complaints: {
        total: totalComplaints,
        resolved,
        escalated,
        pending
      },
      users: {
        teamLeaders: teamLeaders.length,
        staff: staff.length,
        departments: departments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGlobalStats
};
