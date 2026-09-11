const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Leave = require('../models/Leave');
const Category = require('../models/Category');
const Department = require('../models/Department');
const { getSlaThresholdMinutes } = require('../services/escalationService');
const { createNotification, notifyHRAndSuperAdminOnResolution } = require('../services/notificationService');


// Helper to add escalation deadline to a complaint
const addEscalationDeadline = (complaint) => {
  if (!complaint) return null;
  const allowedMinutes = getSlaThresholdMinutes(complaint.priority || 'Medium');
  const createdAt = new Date(complaint.createdAt || new Date());
  const deadline = new Date(createdAt.getTime() + allowedMinutes * 60000);
  const plainObj = typeof complaint.toObject === 'function' ? complaint.toObject() : complaint;
  return { ...plainObj, escalationDeadline: deadline };
};

// Helper function to auto-generate Complaint ID (e.g. CMP0001, CMP0002)
const generateComplaintId = async () => {
  const allComplaints = await Complaint.find({}).select('complaintId');
  let maxNum = 0;
  allComplaints.forEach((c) => {
    if (c.complaintId && c.complaintId.startsWith('CMP')) {
      const num = parseInt(c.complaintId.replace('CMP', ''), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `CMP${nextNum.toString().padStart(4, '0')}`;
};

// @desc    Create a new complaint (Staff only)
// @route   POST /api/complaints
// @access  Private (Staff)
const createComplaint = async (req, res, next) => {
  try {
    const { category, subject, title, description, priority, attachments } = req.body;

    const user = req.user;
    if (!user) {
      res.status(401);
      throw new Error('User authentication required');
    }

    const complaintSubject = subject || title;
    if (!category || !complaintSubject || !description) {
      res.status(400);
      throw new Error('Category, subject, and description are required');
    }

    const generatedId = await generateComplaintId();

    // Populate department name if populated object or string
    let deptName = 'General';
    if (user.department) {
      if (typeof user.department === 'object' && user.department.name) {
        deptName = user.department.name;
      } else if (typeof user.department === 'string') {
        deptName = user.department;
      }
    }

    let assignedTL = user.teamLeader || null;
    let tlUser = null;
    let timelineNote = 'Assigned to Team Leader';
    
    // Auto-reassignment logic based on Leave
    if (assignedTL) {
      // Find the TL user to check leave
      tlUser = await User.findById(assignedTL);
      
      if (tlUser && tlUser.role === 'Team Leader') {
        const today = new Date();
        const activeLeave = await Leave.findOne({
          employee: tlUser._id,
          status: 'Approved',
          startDate: { $lte: today },
          endDate: { $gte: today }
        });
        
        if (activeLeave) {
          // TL is on leave, find a backup TL
          const backupTL = await User.findOne({
            role: 'Team Leader',
            _id: { $ne: tlUser._id }
          });
          
          if (backupTL) {
            tlUser = backupTL;
            assignedTL = backupTL._id;
            timelineNote = `Automatically assigned to Backup TL (${backupTL.name}) because primary TL is on leave.`;
          }
        }
      } else {
        tlUser = null;
        assignedTL = null;
      }
    }

    // Determine Target Department via Category Routing
    const categoryDoc = await Category.findOne({ name: category }).populate('responsibleDepartment');
    let targetDeptId = null;
    let deptManagerId = null;

    if (categoryDoc && categoryDoc.responsibleDepartment) {
      targetDeptId = categoryDoc.responsibleDepartment._id;
      if (categoryDoc.responsibleDepartment.manager) {
        deptManagerId = categoryDoc.responsibleDepartment.manager;
      }
    }

    const complaint = new Complaint({
      complaintId: generatedId,
      staffId: user.employeeId || 'STAFF-UNKNOWN',
      staffName: user.name || 'Staff Member',
      department: deptName, // Kept for legacy compatibility
      designation: user.designation || 'Staff',
      
      // Legacy fields
      teamLeader: tlUser ? tlUser.name : 'Unassigned',
      targetDepartment: category, 
      
      // New normalized routing fields
      assignedTeamLeader: assignedTL,
      responsibleDepartment: targetDeptId,
      departmentManager: deptManagerId,
      
      category,
      subject: complaintSubject,
      description,
      priority: priority || 'Medium',
      status: 'Pending',
      attachments: attachments || [],
      createdBy: user._id,
      timeline: [
        {
          title: 'Complaint Created',
          description: timelineNote,
          updatedBy: user._id,
          updatedByName: user.name,
          timestamp: new Date()
        }
      ]
    });

    const savedComplaint = await complaint.save();

    // 4. Notify Creator (Staff), Team Leader and Department Manager
    if (savedComplaint.createdBy) {
      await createNotification(
        savedComplaint.createdBy,
        `Your complaint #${savedComplaint.complaintId} ("${savedComplaint.subject}") has been registered successfully.`,
        savedComplaint._id
      );
    }

    if (savedComplaint.assignedTeamLeader) {
      await createNotification(
        savedComplaint.assignedTeamLeader,
        `New complaint assigned: #${savedComplaint.complaintId} - ${savedComplaint.subject}`,
        savedComplaint._id
      );
    }
    
    if (savedComplaint.departmentManager) {
      // Don't duplicate notification if manager is also the TL
      if (String(savedComplaint.departmentManager) !== String(savedComplaint.assignedTeamLeader)) {
        await createNotification(
          savedComplaint.departmentManager,
          `New complaint routed to your department: #${savedComplaint.complaintId}`,
          savedComplaint._id
        );
      }
    }

    res.status(201).json(savedComplaint);
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaints submitted by the logged-in Staff with live stats
// @route   GET /api/complaints/my
// @access  Private (Staff)
const getMyComplaints = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const staffEmpId = req.user.employeeId || '';
    const userRole = req.user.role || 'Staff';

    let query = {};
    if (['Super Admin', 'HR', 'Manager'].includes(userRole)) {
      query = {}; // Administrative roles can view all complaints in tracking
    } else if (userRole === 'Team Leader') {
      query = {
        $or: [
          { assignedTeamLeader: userId },
          { teamLeader: staffEmpId },
          { createdBy: userId },
          { staffId: staffEmpId }
        ]
      };
    } else {
      query = {
        $or: [
          { createdBy: userId },
          { createdBy: userId.toString() },
          { staffId: staffEmpId },
          { staffId: { $regex: new RegExp(`^${staffEmpId}$`, 'i') } }
        ]
      };
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name employeeId department designation email phone')
      .populate('assignedTo', 'name employeeId role')
      .populate('assignedTeamLeader', 'name employeeId role')
      .populate('departmentManager', 'name employeeId role')
      .populate('responsibleDepartment', 'name')
      .lean();

    const totalComplaints = complaints.length;
    const pendingComplaints = complaints.filter(c => c.status === 'Pending' || c.status === 'Submitted').length;
    const inProgressComplaints = complaints.filter(c => c.status === 'In Progress' || c.status === 'Escalated' || c.status === 'Waiting on User').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Approved').length;

    res.json({
      complaints: complaints.map(addEscalationDeadline),
      stats: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint by ID or complaintId
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let complaint;

    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id)
        .populate('responsibleDepartment', 'name')
        .populate('assignedTeamLeader', 'name employeeId')
        .populate('departmentManager', 'name employeeId');
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: id })
        .populate('responsibleDepartment', 'name')
        .populate('assignedTeamLeader', 'name employeeId')
        .populate('departmentManager', 'name employeeId');
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }

    // Access control: Staff can only view their own complaint; TL only their team; Manager only their department
    if (req.user.role === 'Staff') {
      const isOwner =
        (complaint.createdBy && complaint.createdBy.toString() === req.user._id.toString()) ||
        (complaint.staffId && complaint.staffId === req.user.employeeId);

      if (!isOwner) {
        res.status(403);
        throw new Error('Not authorized to view complaints belonging to other staff members');
      }
    } else if (req.user.role === 'Team Leader') {
      const { isAuthorizedForTLComplaint } = require('./teamLeaderController');
      if (!(await isAuthorizedForTLComplaint(complaint, req.user))) {
        res.status(403);
        throw new Error('Not authorized to access complaints outside your team');
      }
    } else if (req.user.role === 'Manager') {
      const { isAuthorizedForComplaint } = require('./managerController');
      if (!(await isAuthorizedForComplaint(req.user, complaint))) {
        res.status(403);
        throw new Error('Not authorized to access complaints outside your department');
      }
    }

    res.json(addEscalationDeadline(complaint));
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint (Add comment / update status / timeline)
// @route   PUT /api/complaints/:id
// @access  Private
const updateComplaint = async (req, res, next) => {
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

    const { 
      status, 
      comment, 
      priority, 
      category, 
      description,
      assignedTo,
      assignedTeamLeader,
      responsibleDepartment,
      departmentManager,
      timelineTitle,
      timelineDescription
    } = req.body;

    // Role-based Access Control for updating a complaint
    if (req.user.role === 'Staff') {
      const isOwner =
        (complaint.createdBy && complaint.createdBy.toString() === req.user._id.toString()) ||
        (complaint.staffId && complaint.staffId === req.user.employeeId);

      if (!isOwner) {
        res.status(403);
        throw new Error('Not authorized to modify complaints belonging to other staff members');
      }

      if (status && status !== complaint.status) {
        res.status(403);
        throw new Error('Staff are not authorized to directly modify status. Use cancel or reopen routes.');
      }
      if (priority && priority !== complaint.priority) {
        res.status(403);
        throw new Error('Staff are not authorized to modify priority.');
      }
      if (assignedTo !== undefined || assignedTeamLeader !== undefined || departmentManager !== undefined || responsibleDepartment !== undefined) {
        res.status(403);
        throw new Error('Staff are not authorized to modify assignment fields.');
      }
    } else if (req.user.role === 'Team Leader') {
      const { isAuthorizedForTLComplaint } = require('./teamLeaderController');
      if (!(await isAuthorizedForTLComplaint(complaint, req.user))) {
        res.status(403);
        throw new Error('Not authorized to modify complaints outside your team');
      }
    } else if (req.user.role === 'Manager') {
      const { isAuthorizedForComplaint } = require('./managerController');
      if (!(await isAuthorizedForComplaint(req.user, complaint))) {
        res.status(403);
        throw new Error('Not authorized to modify complaints outside your department');
      }
    }

    if (status && status !== complaint.status) {
      if (status === 'Waiting on User') {
        complaint.slaPausedAt = new Date();
      } else if (complaint.status === 'Waiting on User' && complaint.slaPausedAt) {
        // Leaving 'Waiting on User' state, calculate paused time
        const pausedMinutes = (new Date() - complaint.slaPausedAt) / 60000;
        complaint.totalPausedDuration = (complaint.totalPausedDuration || 0) + pausedMinutes;
        complaint.slaPausedAt = undefined;
      }

      complaint.status = status;
      complaint.timeline.push({
        title: `Status changed to ${status}`,
        description: comment || `Status updated by ${req.user.name} (${req.user.role})`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date()
      });
      if (status === 'Resolved') complaint.resolvedDate = new Date();
      if (status === 'Closed') complaint.closedDate = new Date();
    }

    if (comment) {
      complaint.comments.push({
        senderName: req.user.name,
        senderRole: req.user.role,
        message: comment,
        createdAt: new Date()
      });
    }

    if (timelineTitle) {
      complaint.timeline.push({
        title: timelineTitle,
        description: timelineDescription || `Super Admin recorded audit event.`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date()
      });
    }

    if (assignedTo !== undefined) {
      complaint.assignedTo = assignedTo || null;
      complaint.timeline.push({
        title: `Resolver Assigned`,
        description: `Handler assigned by ${req.user.name}`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date()
      });
    }

    if (assignedTeamLeader !== undefined) {
      complaint.assignedTeamLeader = assignedTeamLeader || null;
    }

    if (departmentManager !== undefined) {
      complaint.departmentManager = departmentManager || null;
    }

    if (responsibleDepartment !== undefined) {
      complaint.responsibleDepartment = responsibleDepartment || null;
    }

    if (priority) complaint.priority = priority;
    if (category) complaint.category = category;
    if (description) complaint.description = description;

    const updated = await complaint.save();

    // Notifications on status change or comment
    if (status && status !== 'Resolved' && updated.createdBy) {
      await createNotification(
        updated.createdBy,
        `Your complaint (${updated.complaintId}) status has been updated to "${status}".`,
        updated._id
      );
    }

    if (status === 'Resolved') {
      if (updated.createdBy) {
        await createNotification(
          updated.createdBy,
          `Your complaint (${updated.complaintId}) has been resolved.`,
          updated._id
        );
      }
      await notifyHRAndSuperAdminOnResolution(updated, req.user ? req.user.name : '');
    }

    if (comment && updated.createdBy && String(updated.createdBy) !== String(req.user._id)) {
      await createNotification(
        updated.createdBy,
        `New comment added on your complaint (${updated.complaintId}) by ${req.user.name} (${req.user.role}).`,
        updated._id
      );
    }

    const populatedComplaint = await Complaint.findById(updated._id)
      .populate('responsibleDepartment', 'name')
      .populate('assignedTeamLeader', 'name employeeId role')
      .populate('departmentManager', 'name employeeId role')
      .populate('assignedTo', 'name employeeId role')
      .populate('createdBy', 'name employeeId email phone department designation');

    res.json(addEscalationDeadline(populatedComplaint || updated));
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints (For HR, Admin, Team Leader)
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'Staff') {
      query = {
        $or: [
          { createdBy: req.user._id },
          { staffId: req.user.employeeId }
        ]
      };
    } else if (req.user.role === 'Team Leader') {
      query = {
        $or: [
          { assignedTeamLeader: req.user._id },
          { assignedTo: req.user._id },
          // Legacy fallbacks
          { teamLeader: req.user.employeeId },
          { teamLeader: req.user._id.toString() },
          { teamLeader: req.user.name }
        ]
      };
    } else if (req.user.role === 'Manager') {
      // Department Manager only sees their responsible department complaints
      if (req.user.department) {
        query = { responsibleDepartment: req.user.department };
      } else {
        // Fallback if Manager's own department isn't populated properly
        query = { departmentManager: req.user._id };
      }
    } else if (req.user.role === 'Super Admin') {
      // Super Admin sees all complaints.
      query = {};
    } else if (req.user.role === 'HR') {
      query = {};
    }

    const complaints = await Complaint.find(query)
      .populate('responsibleDepartment', 'name')
      .populate('assignedTeamLeader', 'name employeeId role')
      .populate('departmentManager', 'name employeeId role')
      .populate('assignedTo', 'name employeeId role')
      .populate('createdBy', 'name employeeId email phone department designation')
      .sort({ createdAt: -1 });

    res.json(complaints.map(addEscalationDeadline));
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a complaint (Staff only)
// @route   PUT /api/complaints/:id/cancel
// @access  Private (Staff)
const cancelComplaint = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    let complaint;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }
    const isOwner =
      (complaint.createdBy && complaint.createdBy.toString() === req.user._id.toString()) ||
      (complaint.staffId && complaint.staffId === req.user.employeeId);

    if (!isOwner) {
      res.status(401);
      throw new Error('Not authorized to cancel this complaint');
    }
    if (complaint.status !== 'Pending' && complaint.status !== 'Submitted') {
      res.status(400);
      throw new Error('Can only cancel Pending or Submitted complaints');
    }

    complaint.status = 'Cancelled';
    complaint.closedDate = new Date();
    complaint.timeline.push({
      title: 'Ticket Cancelled',
      description: 'The ticket was cancelled by the staff member.',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    await complaint.save();
    res.json(addEscalationDeadline(complaint));
  } catch (error) {
    next(error);
  }
};

// @desc    Reopen a resolved/closed complaint (Staff only)
// @route   PUT /api/complaints/:id/reopen
// @access  Private (Staff)
const reopenComplaint = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const mongoose = require('mongoose');
    let complaint;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }
    const isOwner =
      (complaint.createdBy && complaint.createdBy.toString() === req.user._id.toString()) ||
      (complaint.staffId && complaint.staffId === req.user.employeeId);

    if (!isOwner) {
      res.status(401);
      throw new Error('Not authorized to reopen this complaint');
    }
    if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
      res.status(400);
      throw new Error('Only Resolved or Closed complaints can be reopened');
    }
    if (complaint.feedbackRating) {
      res.status(400);
      throw new Error('Complaint cannot be reopened after feedback and rating have been submitted');
    }

    complaint.status = 'In Progress';
    // Clear resolved/closed dates if we are reopening
    complaint.resolvedDate = undefined;
    complaint.closedDate = undefined;
    
    complaint.timeline.push({
      title: 'Ticket Reopened',
      description: comment || 'The ticket was reopened by the staff member.',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const notifyUser = complaint.assignedTeamLeader || complaint.departmentManager || complaint.assignedTo;
    if (notifyUser) {
      await createNotification(
        notifyUser,
        `Ticket #${complaint.complaintId} has been reopened by ${req.user.name}. Reason: ${comment || 'No reason provided.'}`,
        complaint._id
      );
    }

    await complaint.save();
    res.json(addEscalationDeadline(complaint));
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback/rating for a complaint (Staff only)
// @route   PUT /api/complaints/:id/feedback
// @access  Private (Staff)
const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const mongoose = require('mongoose');
    let complaint;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }
    const isOwner =
      (complaint.createdBy && complaint.createdBy.toString() === req.user._id.toString()) ||
      (complaint.staffId && complaint.staffId === req.user.employeeId);

    if (!isOwner) {
      res.status(401);
      throw new Error('Not authorized to submit feedback');
    }
    if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
      res.status(400);
      throw new Error('Can only submit feedback for Resolved or Closed complaints');
    }

    complaint.feedbackRating = rating;
    complaint.feedbackComment = comment;

    await complaint.save();

    // 1. Create Feedback record
    try {
      const Feedback = require('../models/Feedback');
      await Feedback.create({
        complaint: complaint._id,
        user: req.user._id,
        rating,
        comment
      });
    } catch (feedbackErr) {
      console.warn('Could not save feedback to collection:', feedbackErr);
    }

    // 2. Notify all HR users
    try {
      const hrUsers = await User.find({ role: 'HR', status: 'Active' });
      for (const hr of hrUsers) {
        await createNotification(
          hr._id,
          'Feedback Rating Submitted',
          `User ${req.user.name} submitted a rating of ${rating}/5 for Complaint #${complaint.complaintId}. Comment: "${comment || 'None'}"`,
          'info'
        );
      }
    } catch (notifErr) {
      console.warn('Could not notify HR of rating submission:', notifErr);
    }

    res.json(addEscalationDeadline(complaint));
  } catch (error) {
    next(error);
  }
};

// @desc    Manually trigger SLA evaluation and escalation check
// @route   POST /api/complaints/trigger-sla-check
// @access  Private (Super Admin, HR, Manager)
const triggerSlaCheck = async (req, res, next) => {
  try {
    const { runEscalationCheck } = require('../services/escalationService');
    const result = await runEscalationCheck();
    res.json({
      message: 'SLA escalation check completed successfully',
      result: result || { success: true }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Extend SLA deadline for a complaint (Super Admin only)
// @route   PUT /api/complaints/:id/extend-sla
// @access  Private (Super Admin)
const extendSlaDeadline = async (req, res, next) => {
  try {
    const { hours, reason } = req.body;
    const mongoose = require('mongoose');
    let complaint;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }

    const additionalMinutes = Number(hours || 2) * 60;
    // Add grace duration to totalPausedDuration so calculateBusinessMinutes counts it as extra time allowed
    complaint.totalPausedDuration = (complaint.totalPausedDuration || 0) + additionalMinutes;

    complaint.timeline.push({
      title: `SLA Deadline Extended (+${hours} Hours)`,
      description: `Super Admin granted grace period of ${hours} hours. Reason: ${reason || 'Executive exception'}`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    await complaint.save();

    const populated = await Complaint.findById(complaint._id)
      .populate('responsibleDepartment', 'name')
      .populate('assignedTeamLeader', 'name employeeId role')
      .populate('departmentManager', 'name employeeId role')
      .populate('assignedTo', 'name employeeId role')
      .populate('createdBy', 'name employeeId email phone department designation');
    res.json(addEscalationDeadline(populated || complaint));
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a comment on a complaint (strictly within 15 minutes window)
// @route   PUT /api/complaints/:id/comments/:commentIndex
// @access  Private
const updateComment = async (req, res, next) => {
  try {
    const { id, commentIndex } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
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

    // Find target comment by index or ObjectId
    let comment = null;
    if (mongoose.Types.ObjectId.isValid(commentIndex)) {
      comment = complaint.comments.id(commentIndex);
    } else {
      const idx = parseInt(commentIndex, 10);
      if (!isNaN(idx) && complaint.comments[idx]) {
        comment = complaint.comments[idx];
      }
    }

    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    // 15 Minutes Edit Window Check
    const commentTime = new Date(comment.createdAt || Date.now()).getTime();
    const currentTime = Date.now();
    const diffMinutes = (currentTime - commentTime) / (1000 * 60);

    if (diffMinutes > 15) {
      res.status(400);
      throw new Error('Comments can only be edited within 15 minutes of posting.');
    }

    // Authorization check: User must be sender or HR / Admin
    const isSender = (comment.senderId && String(comment.senderId) === String(req.user._id)) ||
                     (comment.senderName === req.user.name) ||
                     (['HR', 'Super Admin'].includes(req.user.role));

    if (!isSender) {
      res.status(403);
      throw new Error('Not authorized to edit this comment.');
    }

    comment.message = message.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();

    const updated = await complaint.save();

    const populated = await Complaint.findById(updated._id)
      .populate('responsibleDepartment', 'name')
      .populate('assignedTeamLeader', 'name employeeId role')
      .populate('departmentManager', 'name employeeId role')
      .populate('assignedTo', 'name employeeId role')
      .populate('createdBy', 'name employeeId email phone department designation');

    res.json(addEscalationDeadline(populated || updated));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  updateComment,
  getComplaints,
  cancelComplaint,
  reopenComplaint,
  submitFeedback,
  triggerSlaCheck,
  extendSlaDeadline
};
