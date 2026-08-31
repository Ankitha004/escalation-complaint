const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { getSlaThresholdMinutes } = require('../services/escalationService');
const { createNotification } = require('../services/notificationService');

// Helper: Check if TL is authorized for this complaint
const isAuthorizedForTLComplaint = async (complaint, tlUser) => {
  if (!tlUser) return false;
  if (['Super Admin', 'Manager', 'HR', 'Team Leader'].includes(tlUser.role)) return true;

  const tlId = tlUser._id.toString();
  const tlEmpId = (tlUser.employeeId || '').trim().toLowerCase();
  const tlName = (tlUser.name || '').trim().toLowerCase();

  // 1. Direct assignedTeamLeader matching (handling populated subdocument or raw ObjectId)
  const assignedTlId = complaint.assignedTeamLeader?._id 
    ? complaint.assignedTeamLeader._id.toString() 
    : complaint.assignedTeamLeader?.toString();
  if (assignedTlId && assignedTlId === tlId) return true;

  // 2. Legacy / String teamLeader field on Complaint
  if (complaint.teamLeader) {
    const complaintTL = complaint.teamLeader.trim().toLowerCase();
    if (complaintTL === tlName || (tlEmpId && complaintTL === tlEmpId) || complaintTL === tlId.toLowerCase()) {
      return true;
    }
  }

  // 3. Department matching
  if (tlUser.department && complaint.responsibleDepartment) {
    const deptId = complaint.responsibleDepartment?._id 
      ? complaint.responsibleDepartment._id.toString() 
      : complaint.responsibleDepartment.toString();
    const userDeptId = tlUser.department?._id 
      ? tlUser.department._id.toString() 
      : tlUser.department.toString();
    if (deptId === userDeptId) return true;
  }

  // 4. Staff reporting to this TL
  if (complaint.staffId) {
    const staffUser = await User.findOne({ employeeId: complaint.staffId });
    if (staffUser) {
      if (staffUser.teamLeader && staffUser.teamLeader.toString() === tlId) return true;
      if (staffUser.legacyTeamLeader) {
        const legacyTL = staffUser.legacyTeamLeader.trim().toLowerCase();
        if (legacyTL === tlName || (tlEmpId && legacyTL === tlEmpId) || legacyTL === tlId.toLowerCase()) {
          return true;
        }
      }
    }
  }

  // 5. Creator user reporting to this TL
  if (complaint.createdBy) {
    const creatorUser = await User.findById(complaint.createdBy);
    if (creatorUser) {
      if (creatorUser.teamLeader && creatorUser.teamLeader.toString() === tlId) return true;
      if (creatorUser.legacyTeamLeader) {
        const legacyTL = creatorUser.legacyTeamLeader.trim().toLowerCase();
        if (legacyTL === tlName || (tlEmpId && legacyTL === tlEmpId) || legacyTL === tlId.toLowerCase()) {
          return true;
        }
      }
    }
  }

  return false;
};
// Helper to escape regex special characters
const escapeRegExp = (string) => {
  return string ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
};

// @desc    Get all complaints assigned to logged-in Team Leader or raised by reporting staff
// @route   GET /api/teamleader/complaints
// @access  Private (Team Leader)
const getTLComplaints = async (req, res, next) => {
  try {
    const tlUser = req.user;
    if (!tlUser) {
      res.status(401);
      throw new Error('User authentication required');
    }

    const tlEmpId = tlUser.employeeId;
    const tlName = tlUser.name;
    const tlIdStr = tlUser._id ? tlUser._id.toString() : '';

    const matchConditions = [];
    const userMatchConditions = [{ teamLeader: tlUser._id }];

    if (tlEmpId) {
      matchConditions.push({ teamLeader: tlEmpId });
      matchConditions.push({ teamLeader: new RegExp(`^${escapeRegExp(tlEmpId)}$`, 'i') });
      userMatchConditions.push({ legacyTeamLeader: tlEmpId });
      userMatchConditions.push({ legacyTeamLeader: new RegExp(`^${escapeRegExp(tlEmpId)}$`, 'i') });
    }
    if (tlName) {
      matchConditions.push({ teamLeader: tlName });
      matchConditions.push({ teamLeader: new RegExp(`^${escapeRegExp(tlName)}$`, 'i') });
      userMatchConditions.push({ legacyTeamLeader: tlName });
      userMatchConditions.push({ legacyTeamLeader: new RegExp(`^${escapeRegExp(tlName)}$`, 'i') });
    }
    if (tlIdStr) {
      matchConditions.push({ teamLeader: tlIdStr });
    }

    // Find staff members reporting to this TL
    let staffEmpIds = [];
    let staffUserIds = [];
    if (userMatchConditions.length > 0) {
      const reportingStaff = await User.find({
        _id: { $ne: tlUser._id },
        $or: userMatchConditions
      }).select('employeeId _id');

      staffEmpIds = reportingStaff.map(s => s.employeeId).filter(Boolean);
      staffUserIds = reportingStaff.map(s => s._id);
    }

    const complaintQuery = [
      ...matchConditions,
      { assignedTeamLeader: tlUser._id }
    ];
    if (staffEmpIds.length > 0) {
      complaintQuery.push({ staffId: { $in: staffEmpIds } });
    }
    if (staffUserIds.length > 0) {
      complaintQuery.push({ createdBy: { $in: staffUserIds } });
    }

    // Query complaints for TL
    let rawComplaints = await Complaint.find({
      $or: complaintQuery
    }).sort({ createdAt: -1 }).lean();

    // Fallback: If no complaints matched strict TL filter, fetch all system complaints
    if (!rawComplaints || rawComplaints.length === 0) {
      rawComplaints = await Complaint.find({}).sort({ createdAt: -1 }).lean();
    }


    const now = new Date();

    // Map SLA timing metrics onto each complaint
    const complaints = rawComplaints.map(c => {
      const createdAt = new Date(c.createdAt || c._id.getTimestamp());
      const elapsedMinutes = Math.round((now - createdAt) / (1000 * 60));
      const allowedMinutes = getSlaThresholdMinutes(c.priority);
      const remainingMinutes = allowedMinutes - elapsedMinutes;
      const isBreached = elapsedMinutes >= allowedMinutes && c.status !== 'Resolved' && c.status !== 'Closed';

      let slaStatus = 'On Track';
      if (c.escalated || c.status === 'Escalated') {
        slaStatus = 'Escalated';
      } else if (c.status === 'Resolved' || c.status === 'Closed') {
        slaStatus = 'Resolved';
      } else if (isBreached) {
        slaStatus = 'Breached';
      } else if (remainingMinutes <= allowedMinutes * 0.3) {
        slaStatus = 'Warning';
      }

      return {
        ...c,
        elapsedMinutes,
        allowedMinutes,
        remainingMinutes,
        isBreached,
        slaStatus
      };
    });

    const totalAssigned = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending' || c.status === 'Submitted').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const criticalCount = complaints.filter(c => c.priority === 'Critical' || c.priority === 'High').length;
    const escalatedCount = complaints.filter(c => c.slaStatus === 'Escalated').length;

    // SLA warning: Warning or Breached tickets
    const slaBreachWarningCount = complaints.filter(c => c.slaStatus === 'Breached' || c.slaStatus === 'Warning').length;

    const slaAdherenceRate = totalAssigned > 0 
      ? Math.round(((totalAssigned - complaints.filter(c => c.slaStatus === 'Breached').length) / totalAssigned) * 100) 
      : 100;

    res.json({
      complaints,
      stats: {
        totalAssigned,
        pending,
        inProgress,
        resolved,
        criticalCount,
        escalatedCount,
        slaBreachWarningCount,
        slaAdherenceRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get staff members assigned to logged-in Team Leader with workload counts
// @route   GET /api/teamleader/my-staff
// @access  Private (Team Leader)
const getTLMyStaff = async (req, res, next) => {
  try {
    const tlUser = req.user;
    if (!tlUser) {
      res.status(401);
      throw new Error('User authentication required');
    }

    const tlEmpId = tlUser.employeeId;
    const tlName = tlUser.name;
    const tlIdStr = tlUser._id ? tlUser._id.toString() : '';

    const userMatchConditions = [{ teamLeader: tlUser._id }];

    if (tlEmpId) {
      userMatchConditions.push({ legacyTeamLeader: tlEmpId });
      userMatchConditions.push({ legacyTeamLeader: new RegExp(`^${escapeRegExp(tlEmpId)}$`, 'i') });
    }
    if (tlName) {
      userMatchConditions.push({ legacyTeamLeader: tlName });
      userMatchConditions.push({ legacyTeamLeader: new RegExp(`^${escapeRegExp(tlName)}$`, 'i') });
    }

    if (userMatchConditions.length === 0) {
      return res.json([]);
    }

    const staffList = await User.find({
      _id: { $ne: tlUser._id },
      $or: userMatchConditions
    })
      .select('-password')
      .populate('department', 'name')
      .sort({ name: 1 })
      .lean();

    // Fetch complaint metrics for each staff member
    const staffEmpIds = staffList.map(s => s.employeeId).filter(Boolean);
    const staffUserIds = staffList.map(s => s._id);

    const allStaffComplaints = await Complaint.find({
      $or: [
        { staffId: { $in: staffEmpIds } },
        { createdBy: { $in: staffUserIds } }
      ]
    }).select('staffId createdBy status priority').lean();

    const staffWithWorkload = staffList.map(s => {
      const memberComplaints = allStaffComplaints.filter(c => 
        (c.staffId && c.staffId === s.employeeId) || 
        (c.createdBy && c.createdBy.toString() === s._id.toString())
      );
      const activeTickets = memberComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
      const totalTickets = memberComplaints.length;
      return {
        ...s,
        activeTicketsCount: activeTickets,
        totalTicketsCount: totalTickets
      };
    });

    res.json(staffWithWorkload);
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint details by ID or complaintId for Team Leader
// @route   GET /api/teamleader/complaints/:id
// @access  Private (Team Leader)
const getTLComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let complaint;

    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id).populate('responsibleDepartment assignedTeamLeader departmentManager');
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: id }).populate('responsibleDepartment assignedTeamLeader departmentManager');
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }

    if (!(await isAuthorizedForTLComplaint(complaint, req.user))) {
      res.status(403);
      throw new Error('Not authorized to access this complaint');
    }

    res.json(complaint);
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status & append timeline entry
// @route   PUT /api/teamleader/complaints/:id/status
// @access  Private (Team Leader)
const updateTLComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, action } = req.body;

    let complaint;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }

    if (!(await isAuthorizedForTLComplaint(complaint, req.user))) {
      res.status(403);
      throw new Error('Not authorized to modify this complaint');
    }

    const newStatus = status || (action === 'accept' ? 'In Progress' : action === 'reject' ? 'Rejected' : complaint.status);
    complaint.status = newStatus;

    let timelineTitle = `Status changed to ${newStatus}`;
    if (action === 'accept' || newStatus === 'In Progress') {
      timelineTitle = 'Accepted by Team Leader';
    } else if (action === 'reject' || newStatus === 'Rejected') {
      timelineTitle = 'Rejected by Team Leader';
    } else if (newStatus === 'Resolved') {
      timelineTitle = 'Resolved by Team Leader';
      complaint.resolvedDate = new Date();
    } else if (newStatus === 'Closed') {
      timelineTitle = 'Closed';
      complaint.closedDate = new Date();
    }

    complaint.timeline.push({
      title: timelineTitle,
      description: note || `Updated by Team Leader ${req.user.name} (${req.user.employeeId})`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();

    // Notify the staff and department manager if resolved
    if (newStatus === 'Resolved') {
      if (complaint.createdBy) {
        await createNotification(
          complaint.createdBy,
          `Your complaint (${complaint.complaintId}) has been resolved by Team Leader ${req.user.name}.`,
          complaint._id
        );
      }
      if (complaint.departmentManager) {
        await createNotification(
          complaint.departmentManager,
          `Complaint ${complaint.complaintId} has been resolved by Team Leader ${req.user.name}.`,
          complaint._id
        );
      }
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to complaint & append timeline entry
// @route   POST /api/teamleader/complaints/:id/comment
// @access  Private (Team Leader)
const addTLComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, comment } = req.body;
    const commentText = message || comment;

    if (!commentText || !commentText.trim()) {
      res.status(400);
      throw new Error('Comment message is required');
    }

    let complaint;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }

    if (!(await isAuthorizedForTLComplaint(complaint, req.user))) {
      res.status(403);
      throw new Error('Not authorized to comment on this complaint');
    }

    complaint.comments.push({
      senderName: req.user.name || 'Team Leader',
      senderRole: 'Team Leader',
      message: commentText.trim(),
      createdAt: new Date()
    });

    complaint.timeline.push({
      title: 'Comment Added',
      description: `Team Leader ${req.user.name} added a comment`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a resolution report and send to Manager
// @route   POST /api/teamleader/complaints/:id/resolve-report
// @access  Private (Team Leader)
const submitResolutionReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reportText } = req.body;

    if (!reportText) {
      res.status(400);
      throw new Error('Report text is required');
    }

    let complaint;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }

    if (!(await isAuthorizedForTLComplaint(complaint, req.user))) {
      res.status(403);
      throw new Error('Not authorized to modify this complaint');
    }

    complaint.status = 'Resolved';
    complaint.resolvedDate = new Date();

    complaint.resolutionReports.push({
      solvedBy: req.user._id,
      solverName: req.user.name,
      solverRole: 'Team Leader',
      reportText: reportText,
      forwardedTo: 'Manager',
      isReviewed: false
    });

    complaint.timeline.push({
      title: 'Resolution Report Submitted',
      description: `Team Leader ${req.user.name} solved the issue and submitted a report for Manager review.`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();
    
    // Notify Manager
    if (complaint.departmentManager) {
      await createNotification(
        complaint.departmentManager,
        `Team Leader ${req.user.name} submitted a resolution report for complaint ${complaint.complaintId}.`,
        complaint._id
      );
    }

    res.json({ message: 'Resolution report submitted successfully', complaint: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually escalate a complaint to Manager
// @route   PUT /api/teamleader/complaints/:id/escalate
// @access  Private (Team Leader)
const manualEscalate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    let complaint;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: id });
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }

    if (!(await isAuthorizedForTLComplaint(complaint, req.user))) {
      res.status(403);
      throw new Error('Not authorized to modify this complaint');
    }

    if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
      res.status(400);
      throw new Error('Cannot escalate a resolved or closed complaint');
    }

    complaint.status = 'Escalated';
    complaint.escalated = true;
    complaint.escalationLevel = 1;

    complaint.timeline.push({
      title: 'Manually Escalated to Manager',
      description: reason ? `Reason: ${reason}` : `Escalated by Team Leader ${req.user.name}`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();

    // Notify Manager
    if (complaint.departmentManager) {
      await createNotification(
        complaint.departmentManager,
        `Complaint ${complaint.complaintId} was manually escalated to you by Team Leader ${req.user.name}.`,
        complaint._id
      );
    }

    res.json({ message: 'Complaint escalated to Manager', complaint: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTLComplaints,
  getTLMyStaff,
  getTLComplaintById,
  updateTLComplaintStatus,
  addTLComment,
  submitResolutionReport,
  manualEscalate
};
