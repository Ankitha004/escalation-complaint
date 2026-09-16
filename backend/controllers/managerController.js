const Complaint = require('../models/Complaint');
const EscalationLog = require('../models/EscalationLog');
const User = require('../models/User');
const Department = require('../models/Department');
const { createNotification, notifyHRAndSuperAdminOnResolution } = require('../services/notificationService');
const { getSlaThresholdMinutes } = require('../services/escalationService');

// Helper: Check if Manager is authorized for this complaint
const isAuthorizedForComplaint = async (user, complaint) => {
  if (!user) return false;
  if (['Super Admin', 'HR'].includes(user.role)) return true;
  
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

    // Query for complaints related to their managed departments or assigned to manager
    const query = {
      $or: [
        { responsibleDepartment: { $in: managedDeptIds } },
        { departmentManager: req.user._id },
        { assignedTo: req.user._id }
      ]
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
      if (c.escalated || c.status === 'Escalated' || c.status === 'Escalated to Super Admin') {
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
    const pendingReview = complaints.filter(c => ['Pending', 'Submitted', 'Pending HR Review'].includes(c.status)).length;
    const inProgress = complaints.filter(c => ['In Progress', 'Waiting on User'].includes(c.status)).length;
    const escalatedToManager = complaints.filter(c => c.escalated === true || c.status === 'Escalated' || c.status === 'Escalated to Super Admin').length;
    const slaAtRisk = complaints.filter(c => c.slaStatus === 'Breached' || c.slaStatus === 'Warning').length;
    const resolved = complaints.filter(c => ['Closed', 'Resolved', 'Approved'].includes(c.status)).length;

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

    // Find the Team Leader user document to get their ObjectId, employeeId, and name
    const tlQuery = [{ employeeId: teamLeader }, { name: teamLeader }];
    if (mongoose.Types.ObjectId.isValid(teamLeader)) {
      tlQuery.push({ _id: teamLeader });
    }
    const tlUser = await User.findOne({ $or: tlQuery });

    const tlDisplayName = tlUser ? `${tlUser.name} (${tlUser.employeeId})` : teamLeader;
    const tlName = tlUser ? tlUser.name : teamLeader;

    complaint.teamLeader = tlUser ? (tlUser.employeeId || tlUser.name) : teamLeader;
    if (tlUser) {
      complaint.assignedTeamLeader = tlUser._id;
    }
    complaint.status = 'In Progress';
    complaint.escalated = false;
    complaint.escalatedToSuperAdmin = false;

    complaint.timeline.push({
      title: `Complaint reassigned to ${tlDisplayName} by Manager`,
      description: `Reassigned by Manager ${req.user.name} (${req.user.employeeId}) to Team Leader ${tlDisplayName}. Ready for TL resolution.`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();

    // Populate references so returned complaint is complete
    const populated = await Complaint.findById(updated._id)
      .populate('responsibleDepartment', 'name')
      .populate('assignedTeamLeader', 'name employeeId role department designation')
      .populate('departmentManager', 'name employeeId')
      .populate('createdBy', 'name employeeId department designation');

    // Notify the newly assigned Team Leader
    if (tlUser) {
      await createNotification(
        tlUser._id,
        `Complaint #${complaint.complaintId} has been reassigned to you by Manager ${req.user.name}. Please review and resolve.`,
        complaint._id
      );
    }

    // Notify the staff member that their complaint was reassigned
    if (complaint.createdBy) {
      await createNotification(
        complaint.createdBy,
        `Your complaint (${complaint.complaintId}) has been reassigned to Team Leader ${tlName} by Manager.`,
        complaint._id
      );
    }

    res.json(populated || updated);
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

    if (updated.createdBy) {
      await createNotification(
        updated.createdBy,
        `Your complaint (${updated.complaintId}) resolution has been approved by Department Manager ${req.user.name}.`,
        updated._id
      );
    }
    if (updated.assignedTeamLeader) {
      await createNotification(
        updated.assignedTeamLeader,
        `Complaint (${updated.complaintId}) resolution approved by Manager ${req.user.name}.`,
        updated._id
      );
    }

    await notifyHRAndSuperAdminOnResolution(updated, req.user ? req.user.name : '');

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

    if (updated.createdBy) {
      await createNotification(
        updated.createdBy,
        `Your complaint (${updated.complaintId}) has been closed by Department Manager ${req.user.name}.`,
        updated._id
      );
    }
    if (updated.assignedTeamLeader) {
      await createNotification(
        updated.assignedTeamLeader,
        `Complaint (${updated.complaintId}) has been closed by Manager ${req.user.name}.`,
        updated._id
      );
    }

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
      if (status === 'Resolved') {
        complaint.resolvedDate = new Date();
        complaint.resolutionReports.push({
          solvedBy: req.user._id,
          solverName: req.user.name,
          solverRole: 'Manager',
          reportText: note || `Issue marked resolved by Manager ${req.user.name}.`,
          forwardedTo: 'HR',
          isReviewed: false,
          createdAt: new Date()
        });
      }
      complaint.timeline.push({
        title: `Status changed to ${status} by Manager`,
        description: note || `Status updated by Manager ${req.user.name}`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date()
      });
    }

    const updated = await complaint.save();

    if (updated.createdBy) {
      await createNotification(
        updated.createdBy,
        `Your complaint (${updated.complaintId}) status was updated to "${updated.status}" by Manager ${req.user.name}.`,
        updated._id
      );
    }
    if (updated.assignedTeamLeader) {
      await createNotification(
        updated.assignedTeamLeader,
        `Complaint ${updated.complaintId} status updated to "${updated.status}" by Manager ${req.user.name}.`,
        updated._id
      );
    }
    if (status === 'Resolved') {
      await notifyHRAndSuperAdminOnResolution(updated, req.user ? req.user.name : '');
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

    if (updated.createdBy) {
      await createNotification(
        updated.createdBy,
        `Department Manager ${req.user.name} commented on your complaint #${updated.complaintId}.`,
        updated._id
      );
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get performance metrics for all Team Leaders
// @route   GET /api/manager/tl-performance
// @desc    Get performance metrics for all Team Leaders
// @route   GET /api/manager/tl-performance
// @access  Private (Manager, Admin)
const getTeamLeaderPerformance = async (req, res, next) => {
  try {
    // 1. Fetch managed departments for the manager
    let managedDeptIds = [];
    if (req.user.department) managedDeptIds.push(req.user.department);
    const managedDepts = await Department.find({ manager: req.user._id });
    managedDepts.forEach(d => {
      if (!managedDeptIds.some(id => id.toString() === d._id.toString())) {
        managedDeptIds.push(d._id);
      }
    });

    // 2. Fetch all Team Leaders in the system (or department-specific)
    const teamLeaders = await User.find({ role: 'Team Leader' }).populate('department', 'name').lean();

    // 3. Fetch complaints for this manager's department (or all if Super Admin)
    const query = req.user.role === 'Super Admin' 
      ? {} 
      : { 
          $or: [
            { responsibleDepartment: { $in: managedDeptIds } },
            { departmentManager: req.user._id },
            { assignedTo: req.user._id }
          ]
        };
    const allComplaints = await Complaint.find(query).lean();

    // 4. Calculate detailed metrics per Team Leader
    const tlArray = teamLeaders.map(tl => {
      const tlIdStr = tl._id.toString();
      const tlName = (tl.name || '').toLowerCase().trim();
      const tlEmpId = (tl.employeeId || '').toLowerCase().trim();

      // Check if complaint belongs to this TL
      const assigned = allComplaints.filter(c => {
        const cAssignedTL = c.assignedTeamLeader ? c.assignedTeamLeader.toString() : '';
        const cAssignedTo = c.assignedTo ? c.assignedTo.toString() : '';
        const cTLString = (c.teamLeader || '').toLowerCase().trim();

        if (cAssignedTL && cAssignedTL === tlIdStr) return true;
        if (cAssignedTo && cAssignedTo === tlIdStr) return true;
        if (cTLString && (cTLString === tlName || cTLString === tlEmpId || tlName.includes(cTLString) || cTLString.includes(tlName))) return true;

        return false;
      });

      const total = assigned.length;
      const resolved = assigned.filter(c => ['Approved', 'Closed', 'Resolved'].includes(c.status)).length;
      const escalated = assigned.filter(c => c.status === 'Escalated' || c.status === 'Escalated to Super Admin' || c.escalated === true).length;
      const pending = Math.max(0, total - resolved - escalated);
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      // Calculate feedback rating
      const ratings = assigned.filter(c => c.feedbackRating && c.feedbackRating > 0).map(c => Number(c.feedbackRating));
      const avgRating = ratings.length > 0 
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : (total > 0 ? '4.8' : '5.0');

      // Calculate resolution speed in hours
      const resolutionTimes = [];
      assigned.forEach(c => {
        if (['Resolved', 'Closed', 'Approved'].includes(c.status) && c.createdAt && (c.resolvedDate || c.updatedAt)) {
          const hrs = (new Date(c.resolvedDate || c.updatedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
          if (hrs > 0) resolutionTimes.push(hrs);
        }
      });
      const avgHours = resolutionTimes.length > 0 
        ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
        : '8.5';

      // Check if TL is in Manager's department
      const isDeptTL = tl.department && managedDeptIds.some(dId => dId.toString() === (tl.department._id || tl.department).toString());

      return {
        _id: tl._id,
        name: tl.name,
        employeeId: tl.employeeId,
        departmentName: tl.department?.name || 'Assigned Department',
        isDeptTL,
        total,
        resolved,
        pending,
        escalated,
        resolutionRate,
        avgRating,
        avgHours
      };
    });

    // Sort priority: department TLs first, then by resolved count desc, then total desc
    tlArray.sort((a, b) => {
      if (b.resolved !== a.resolved) return b.resolved - a.resolved;
      if (b.total !== a.total) return b.total - a.total;
      return (b.isDeptTL ? 1 : 0) - (a.isDeptTL ? 1 : 0);
    });

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
    await notifyHRAndSuperAdminOnResolution(updated, req.user ? req.user.name : '');
    res.json({ message: 'Manager resolution report submitted successfully', complaint: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Escalate complaint to Super Admin
// @route   PUT /api/manager/complaints/:id/escalate-superadmin
// @access  Private (Manager)
const escalateToSuperAdmin = async (req, res, next) => {
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

    if (!(await isAuthorizedForComplaint(req.user, complaint))) {
      res.status(403);
      throw new Error('Not authorized to modify complaints for other departments');
    }

    if (complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Approved') {
      res.status(400);
      throw new Error('Cannot escalate a resolved or closed complaint');
    }

    complaint.status = 'Escalated to Super Admin';
    complaint.escalated = true;
    complaint.escalatedToSuperAdmin = true;
    complaint.escalationLevel = 2;

    complaint.timeline.push({
      title: 'Escalated to Super Admin',
      description: reason ? `Reason: ${reason}` : `Escalated to Super Admin by Manager ${req.user.name}`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();

    // Create EscalationLog
    try {
      await EscalationLog.create({
        complaint: updated._id,
        level: 2,
        escalatedTo: 'Super Admin',
        reason: reason || 'Manager escalation to Super Admin',
        triggeredBy: 'Manual',
        status: 'Triggered'
      });
    } catch (logErr) {
      console.warn('EscalationLog creation warning:', logErr.message);
    }

    // Notify Super Admin users
    try {
      const superAdmins = await User.find({ role: 'Super Admin', status: 'Active' });
      for (const sa of superAdmins) {
        await createNotification(
          sa._id,
          `Complaint ${complaint.complaintId} was escalated to Super Admin by Manager ${req.user.name}.`,
          complaint._id
        );
      }
    } catch (notifErr) {
      console.warn('Super Admin notification warning:', notifErr.message);
    }

    const populated = await Complaint.findById(updated._id)
      .populate('responsibleDepartment', 'name')
      .populate('assignedTeamLeader', 'name employeeId')
      .populate('departmentManager', 'name employeeId')
      .populate('createdBy', 'name employeeId department designation');

    res.json({ message: 'Complaint escalated to Super Admin successfully', complaint: populated || updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isAuthorizedForComplaint,
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
  submitManagerResolutionReport,
  escalateToSuperAdmin
};
