const Complaint = require('../models/Complaint');
const EscalationLog = require('../models/EscalationLog');
const User = require('../models/User');
const Department = require('../models/Department');
const { createNotification } = require('../services/notificationService');
const { getSlaThresholdMinutes } = require('../services/escalationService');

// Helper: Check if Manager is authorized for this complaint
const isAuthorizedForComplaint = async (user, complaint) => {
  if (!user) return false;
  if (['Super Admin', 'Manager', 'HR'].includes(user.role)) return true;
  
  const managerId = complaint.departmentManager?._id 
    ? complaint.departmentManager._id.toString() 
    : complaint.departmentManager?.toString();
  if (managerId && managerId === user._id.toString()) {
    return true;
  }
  
  const complaintDeptId = complaint.responsibleDepartment?._id 
    ? complaint.responsibleDepartment._id.toString() 
    : complaint.responsibleDepartment?.toString();
  const userDeptId = user.department?._id 
    ? user.department._id.toString() 
    : user.department?.toString();

  if (complaintDeptId) {
    if (userDeptId && userDeptId === complaintDeptId) {
      return true;
    }
    const managedDept = await Department.findOne({ _id: complaintDeptId, manager: user._id });
    if (managedDept) return true;
  }
  return false;
};


// @desc    Get the logged-in Manager's department name
// @route   GET /api/manager/my-department
// @access  Private (Manager)
const getMyDepartment = async (req, res, next) => {
  try {
    let departmentName = 'Department';
    if (req.user.department) {
      const dept = await Department.findById(req.user.department);
      if (dept) departmentName = dept.name;
    }
    // Also check departments where this user is set as manager
    const managedDepts = await Department.find({ manager: req.user._id });
    const managedDeptNames = managedDepts.map(d => d.name);
    if (!departmentName || departmentName === 'Department') {
      if (managedDeptNames.length > 0) departmentName = managedDeptNames[0];
    }
    res.json({ departmentName, managedDepartments: managedDeptNames });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all department complaints with live manager statistics and SLA metrics
// @route   GET /api/manager/complaints
// @access  Private (Manager)
const getManagerComplaints = async (req, res, next) => {
  try {
    let managedDeptIds = [];
    
    // 1. Get from user profile department
    if (req.user.department) {
      managedDeptIds.push(req.user.department);
    }
    
    // 2. Get from departments where they are assigned as manager
    const managedDepts = await Department.find({ manager: req.user._id });
    managedDepts.forEach(d => {
      if (!managedDeptIds.some(id => id.toString() === d._id.toString())) {
        managedDeptIds.push(d._id);
      }
    });

    // Resolve department name for response
    let departmentName = 'Department';
    if (req.user.department) {
      const userDept = await Department.findById(req.user.department);
      if (userDept) departmentName = userDept.name;
    }
    if (departmentName === 'Department' && managedDepts.length > 0) {
      departmentName = managedDepts[0].name;
    }

    // Query for complaints related to their managed departments
    const query = {
      responsibleDepartment: { $in: managedDeptIds }
    };

    const rawComplaints = await Complaint.find(query).sort({ updatedAt: -1 }).lean();

    const now = new Date();

    // Add SLA timing metrics onto each complaint
    const complaints = rawComplaints.map(c => {
      const createdAt = new Date(c.createdAt || (c._id.getTimestamp ? c._id.getTimestamp() : now));
      const elapsedMinutes = Math.round((now - createdAt) / (1000 * 60));
      const allowedMinutes = getSlaThresholdMinutes(c.priority);
      const remainingMinutes = allowedMinutes - elapsedMinutes;
      const isBreached = elapsedMinutes >= allowedMinutes && c.status !== 'Resolved' && c.status !== 'Closed';

      let slaStatus = 'On Track';
      if (c.escalated || c.status === 'Escalated') {
        slaStatus = 'Escalated';
      } else if (c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Approved') {
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

    const totalComplaints = complaints.length;
    const pendingReview = complaints.filter(c => c.status === 'Escalated' || c.status === 'Pending').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Waiting on User').length;
    const escalatedToManager = complaints.filter(c => c.escalated === true || c.status === 'Escalated').length;
    const slaAtRisk = complaints.filter(c => c.slaStatus === 'Breached' || c.slaStatus === 'Warning').length;
    const resolved = complaints.filter(c => c.status === 'Closed' || c.status === 'Resolved' || c.status === 'Approved').length;

    res.json({
      complaints,
      departmentName,
      stats: {
        totalComplaints,
        pendingReview,
        inProgress,
        escalatedToManager,
        slaAtRisk,
        resolved
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get manager complaint details by ID or complaintId + Escalation Logs
// @route   GET /api/manager/complaints/:id
// @access  Private (Manager, Admin)
const getManagerComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to access complaints for other departments');
    }

    const escalationLogs = await EscalationLog.find({
      $or: [
        { complaintId: complaint.complaintId },
        { complaintRef: complaint._id }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      complaint,
      escalationLogs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reassign complaint to another Team Leader
// @route   PUT /api/manager/complaints/:id/reassign
// @access  Private (Manager, Admin)
const reassignComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { teamLeader } = req.body;

    if (!teamLeader) {
      res.status(400);
      throw new Error('Please select a Team Leader to reassign');
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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to modify complaints for other departments');
    }

    complaint.teamLeader = teamLeader;
    complaint.status = 'Pending';
    complaint.escalated = false;

    complaint.timeline.push({
      title: `Complaint reassigned to ${teamLeader} by Manager`,
      description: `Reassigned by Manager ${req.user.name} (${req.user.employeeId})`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();

    // Notify the staff that their complaint was reassigned
    if (complaint.createdBy) {
      await createNotification(
        complaint.createdBy,
        `Your complaint (${complaint.complaintId}) has been reassigned to ${teamLeader} by Manager.`,
        complaint._id
      );
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Approve resolution of a complaint
// @route   PUT /api/manager/complaints/:id/approve
// @access  Private (Manager, Admin)
const approveResolution = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to modify complaints for other departments');
    }

    complaint.status = 'Approved';
    complaint.timeline.push({
      title: 'Resolution approved by Manager',
      description: `Approved by Manager ${req.user.name}`,
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

// @desc    Close complaint
// @route   PUT /api/manager/complaints/:id/close
// @access  Private (Manager, Admin)
const closeComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to modify complaints for other departments');
    }

    complaint.status = 'Closed';
    complaint.escalated = false;
    complaint.closedDate = new Date();

    complaint.timeline.push({
      title: 'Complaint closed by Manager',
      description: `Closed by Manager ${req.user.name}`,
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

// @desc    General status update or priority update by Manager
// @route   PUT /api/manager/complaints/:id/status
// @access  Private (Manager, Admin)
const updateManagerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, note } = req.body;

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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to modify complaints for other departments');
    }

    if (priority && priority !== complaint.priority) {
      complaint.priority = priority;
      complaint.timeline.push({
        title: `Priority changed to ${priority} by Manager`,
        description: note || `Priority updated by Manager ${req.user.name}`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date()
      });
    }

    if (status && status !== complaint.status) {
      complaint.status = status;
      if (status === 'In Progress') complaint.escalated = false;
      complaint.timeline.push({
        title: `Status changed to ${status} by Manager`,
        description: note || `Status updated by Manager ${req.user.name}`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date()
      });
    }

    const updated = await complaint.save();

    // Notify the staff and assigned team leader if resolved
    if (status === 'Resolved') {
      if (complaint.createdBy) {
        await createNotification(
          complaint.createdBy,
          `Your complaint (${complaint.complaintId}) has been resolved by Department Manager ${req.user.name}.`,
          complaint._id
        );
      }
      if (complaint.assignedTeamLeader) {
        await createNotification(
          complaint.assignedTeamLeader,
          `Complaint ${complaint.complaintId} has been resolved by Department Manager ${req.user.name}.`,
          complaint._id
        );
      }
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Add Manager comment
// @route   POST /api/manager/complaints/:id/comment
// @access  Private (Manager, Admin)
const addManagerComment = async (req, res, next) => {
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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to modify complaints for other departments');
    }

    complaint.comments.push({
      senderName: req.user.name || 'Manager',
      senderRole: 'Manager',
      message: commentText.trim(),
      createdAt: new Date()
    });

    complaint.timeline.push({
      title: 'Manager comment added',
      description: `Comment added by Manager ${req.user.name}`,
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

// @desc    Get performance metrics for all Team Leaders
// @route   GET /api/manager/tl-performance
// @access  Private (Manager, Admin)
const getTeamLeaderPerformance = async (req, res, next) => {
  try {
    // 1. Fetch all users with role 'Team Leader'
    const teamLeaders = await User.find({ role: 'Team Leader' });

    // 2. Fetch all complaints
    let managedDeptIds = [];
    if (req.user.department) managedDeptIds.push(req.user.department);
    const managedDepts = await Department.find({ manager: req.user._id });
    managedDepts.forEach(d => {
      if (!managedDeptIds.some(id => id.toString() === d._id.toString())) {
        managedDeptIds.push(d._id);
      }
    });

    const query = req.user.role === 'Super Admin' ? {} : { responsibleDepartment: { $in: managedDeptIds } };
    const allComplaints = await Complaint.find(query);

    const tlStatsMap = {};

    // Initialize stats for every active TL
    teamLeaders.forEach(tl => {
      // Use their employeeId and _id as keys to map complaints back to them
      tlStatsMap[tl.employeeId] = {
        name: tl.name,
        employeeId: tl.employeeId,
        total: 0,
        resolved: 0,
        pending: 0,
        escalated: 0
      };
      tlStatsMap[tl._id.toString()] = tlStatsMap[tl.employeeId];
      // Also map by name just in case older complaints used name
      tlStatsMap[tl.name] = tlStatsMap[tl.employeeId];
    });

    // 3. Aggregate complaints
    allComplaints.forEach(c => {
      const tlKey = c.teamLeader;
      if (tlKey && tlStatsMap[tlKey]) {
        const stats = tlStatsMap[tlKey];
        stats.total += 1;
        
        if (c.status === 'Approved' || c.status === 'Closed' || c.status === 'Resolved') {
          stats.resolved += 1;
        } else if (c.status === 'Escalated' || c.escalated === true) {
          stats.escalated += 1;
        } else {
          stats.pending += 1;
        }
      }
    });

    // 4. Extract unique stats
    const tlArray = teamLeaders.map(tl => tlStatsMap[tl.employeeId]);

    // Sort by resolved count descending
    tlArray.sort((a, b) => b.resolved - a.resolved);

    res.json({
      teamLeaders: tlArray
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forward TL resolution report to HR
// @route   PUT /api/manager/complaints/:id/forward-report
// @access  Private (Manager)
const forwardReportToHR = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to modify complaints for other departments');
    }

    // Mark TL reports as reviewed and forwarded
    let foundReport = false;
    complaint.resolutionReports.forEach(report => {
      if (report.forwardedTo === 'Manager' && !report.isReviewed) {
        report.isReviewed = true;
        report.forwardedTo = 'HR';
        foundReport = true;
      }
    });

    if (!foundReport) {
      res.status(400);
      throw new Error('No pending reports from Team Leader to forward.');
    }

    complaint.status = 'Pending HR Review';

    complaint.timeline.push({
      title: 'Report Forwarded to HR',
      description: `Manager ${req.user.name} reviewed the TL report and forwarded it to HR.`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();
    res.json({ message: 'Report successfully forwarded to HR', complaint: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Manager resolution report to HR
// @route   POST /api/manager/complaints/:id/resolve-report
// @access  Private (Manager)
const submitManagerResolutionReport = async (req, res, next) => {
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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to modify complaints for other departments');
    }

    complaint.status = 'Pending HR Review';
    complaint.resolvedDate = new Date();

    complaint.resolutionReports.push({
      solvedBy: req.user._id,
      solverName: req.user.name,
      solverRole: 'Manager',
      reportText: reportText,
      forwardedTo: 'HR',
      isReviewed: false
    });

    complaint.timeline.push({
      title: 'Resolution Report Submitted',
      description: `Manager ${req.user.name} solved the issue and sent a report to HR.`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();
    res.json({ message: 'Manager resolution report submitted successfully', complaint: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDepartment,
  getManagerComplaints,
  getManagerComplaintById,
  reassignComplaint,
  approveResolution,
  closeComplaint,
  updateManagerStatus,
  addManagerComment,
  getTeamLeaderPerformance,
  forwardReportToHR,
  submitManagerResolutionReport
};
