const User = require('../models/User');
const Department = require('../models/Department');
const mongoose = require('mongoose');
const { notifyHRAndSuperAdminOnResolution } = require('../services/notificationService');

// @desc    Get dashboard statistics from live MongoDB data
// @route   GET /api/hr/stats
// @access  Private (HR/Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingRegistrations,
      totalStaff,
      totalTeamLeaders,
      totalDepartments,
      approvedThisMonth,
      rejectedThisMonth,
      activatedThisMonth,
      pendingThisMonth
    ] = await Promise.all([
      User.countDocuments({ status: 'Pending' }),
      User.countDocuments({ status: 'Active', role: 'Staff' }),
      User.countDocuments({ role: 'Team Leader', status: 'Active' }),
      Department.countDocuments({}),
      User.countDocuments({ status: 'Active', updatedAt: { $gte: startOfMonth } }),
      User.countDocuments({ status: 'Inactive', rejectionReason: { $ne: '' }, updatedAt: { $gte: startOfMonth } }),
      User.countDocuments({ status: 'Active', updatedAt: { $gte: startOfMonth } }),
      User.countDocuments({ status: 'Pending', createdAt: { $gte: startOfMonth } })
    ]);

    res.json({
      pendingRegistrations,
      totalStaff,
      totalTeamLeaders,
      totalDepartments,
      approvedThisMonth,
      rejectedThisMonth,
      activatedThisMonth,
      pendingThisMonth
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all team leaders with assigned staff count from MongoDB
// @route   GET /api/hr/team-leaders
// @access  Private (HR/Admin/Manager)
const getTeamLeaders = async (req, res, next) => {
  try {
    const filter = { role: 'Team Leader' };
    if (req.query.activeOnly === 'true') {
      filter.status = 'Active';
    }

    const teamLeaders = await User.find(filter)
      .select('-password')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    const result = await Promise.all(
      teamLeaders.map(async (tl) => {
        const staffCount = await User.countDocuments({
          status: 'Active',
          teamLeader: tl._id
        });
        const doc = tl.toObject();
        doc.assignedStaffCount = staffCount;
        return doc;
      })
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Team Leader (auto-generates Employee ID like TL001, TL002)
// @route   POST /api/hr/team-leaders
// @access  Private (HR/Admin)
const createTeamLeader = async (req, res, next) => {
  try {
    const { name, email, phone, department, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Name, email, and password are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }

    const allTLs = await User.find({ role: 'Team Leader' }).select('employeeId');
    let maxNum = 0;
    allTLs.forEach((u) => {
      if (u.employeeId && u.employeeId.startsWith('TL')) {
        const num = parseInt(u.employeeId.replace('TL', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const generatedEmpId = `TL${nextNum.toString().padStart(3, '0')}`;

    // Resolve department
    let departmentId;
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentId = department;
      } else {
        let deptDoc = await Department.findOne({ name: department });
        if (!deptDoc) {
          deptDoc = await Department.create({ name: department });
        }
        departmentId = deptDoc._id;
      }
    }

    const newTeamLeader = await User.create({
      employeeId: generatedEmpId,
      name,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      department: departmentId,
      password,
      role: 'Team Leader',
      status: 'Active',
      isFirstLogin: true
    });

    const populatedTL = await User.findById(newTeamLeader._id)
      .select('-password')
      .populate('department', 'name');

    res.status(201).json({
      ...populatedTL.toObject(),
      assignedStaffCount: 0,
      message: `Team Leader ${name} created successfully with ID ${generatedEmpId}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Team Leader details
// @route   PUT /api/hr/team-leaders/:id
// @access  Private (HR/Admin)
const updateTeamLeader = async (req, res, next) => {
  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate || userToUpdate.role !== 'Team Leader') {
      res.status(404);
      throw new Error('Team Leader not found');
    }

    const { name, email, phone, department } = req.body;

    if (name) userToUpdate.name = name;
    if (email) userToUpdate.email = email.toLowerCase().trim();
    if (phone !== undefined) userToUpdate.phone = phone;

    if (department !== undefined) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        userToUpdate.department = department;
      } else if (department) {
        let deptDoc = await Department.findOne({ name: department });
        if (!deptDoc) {
          deptDoc = await Department.create({ name: department });
        }
        userToUpdate.department = deptDoc._id;
      }
    }

    const updatedUser = await userToUpdate.save();
    const populated = await User.findById(updatedUser._id)
      .select('-password')
      .populate('department', 'name');

    const staffCount = await User.countDocuments({
      status: 'Active',
      teamLeader: populated._id
    });

    res.json({
      ...populated.toObject(),
      assignedStaffCount: staffCount,
      message: 'Team Leader updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Team Leader status (Activate / Deactivate)
// @route   PUT /api/hr/team-leaders/:id/status
// @access  Private (HR/Admin)
const updateTeamLeaderStatus = async (req, res, next) => {
  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate || userToUpdate.role !== 'Team Leader') {
      res.status(404);
      throw new Error('Team Leader not found');
    }

    if (req.body && req.body.status) {
      userToUpdate.status = req.body.status;
    } else {
      userToUpdate.status = userToUpdate.status === 'Active' ? 'Inactive' : 'Active';
    }

    const updatedUser = await userToUpdate.save();
    res.json({
      _id: updatedUser._id,
      status: updatedUser.status,
      message: `Team Leader status changed to ${updatedUser.status}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registration requests (supports ?status=pending, ?status=active, etc.)
// @route   GET /api/hr/registrations
// @access  Private (HR/Admin)
const getRegistrations = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = new RegExp(`^${status}$`, 'i');
    }

    const registrations = await User.find(query)
      .select('-password')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    // Map teamLeader ID to teamLeader display info
    const teamLeaders = await User.find({ role: 'Team Leader' }).select('employeeId name');
    const tlMap = {};
    teamLeaders.forEach(tl => {
      tlMap[tl.employeeId] = `${tl.name} (${tl.employeeId})`;
      tlMap[tl._id.toString()] = `${tl.name} (${tl.employeeId})`;
      tlMap[tl.name] = `${tl.name} (${tl.employeeId})`;
    });

    const formatted = registrations.map(reg => {
      const doc = reg.toObject();
      if (doc.teamLeader) {
        doc.teamLeaderName = tlMap[doc.teamLeader] || doc.teamLeader;
      } else {
        doc.teamLeaderName = 'Unassigned';
      }
      return doc;
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single registration request by ID
// @route   GET /api/hr/registrations/:id
// @access  Private (HR/Admin)
const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await User.findById(req.params.id)
      .select('-password')
      .populate('department', 'name');

    if (registration) {
      res.json(registration);
    } else {
      res.status(404);
      throw new Error('Registration request not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Approve staff registration request
// @route   PUT /api/hr/registrations/:id/approve
// @access  Private (HR/Admin)
const approveRegistration = async (req, res, next) => {
  try {
    const userToApprove = await User.findById(req.params.id);

    if (!userToApprove) {
      res.status(404);
      throw new Error('Registration request not found');
    }

    // Preserve the role or update if provided in request body, and set status to Active
    userToApprove.role = req.body.role || userToApprove.role || 'Staff';
    userToApprove.status = 'Active';

    if (req.body.employeeId) {
      userToApprove.employeeId = req.body.employeeId;
    }

    if (req.body.phone) {
      userToApprove.phone = req.body.phone;
    }

    if (req.body.department) {
      if (mongoose.Types.ObjectId.isValid(req.body.department)) {
        userToApprove.department = req.body.department;
      } else {
        let deptDoc = await Department.findOne({ name: req.body.department });
        if (!deptDoc) {
          deptDoc = await Department.create({ name: req.body.department });
        }
        userToApprove.department = deptDoc._id;
      }
    }

    // Store Team Leader Employee ID or ObjectId (not name)
    if (req.body.hasOwnProperty('teamLeader')) {
      if (!req.body.teamLeader || req.body.teamLeader === '') {
        userToApprove.teamLeader = null;
      } else {
        const tlDoc = await User.findOne({
          role: 'Team Leader',
          $or: [
            { employeeId: req.body.teamLeader },
            { _id: mongoose.Types.ObjectId.isValid(req.body.teamLeader) ? req.body.teamLeader : null },
            { name: req.body.teamLeader }
          ]
        });

        if (tlDoc) {
          userToApprove.teamLeader = tlDoc._id;
        } else if (mongoose.Types.ObjectId.isValid(req.body.teamLeader)) {
          userToApprove.teamLeader = req.body.teamLeader;
        } else {
          userToApprove.teamLeader = null;
        }
      }
    }

    if (req.body.designation) {
      userToApprove.designation = req.body.designation;
    }

    if (req.body.cvUrl) {
      userToApprove.cvUrl = req.body.cvUrl;
    }

    if (req.body.cvOriginalName) {
      userToApprove.cvOriginalName = req.body.cvOriginalName;
    }

    userToApprove.approvedBy = req.user ? req.user._id : undefined;
    userToApprove.approvedDate = new Date();

    const updatedUser = await userToApprove.save();
    const populated = await User.findById(updatedUser._id)
      .select('-password')
      .populate('department', 'name');

    res.json({
      ...populated.toObject(),
      message: 'Staff registration request approved successfully.'
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    next(error);
  }
};

// @desc    Reject staff registration request
// @route   PUT /api/hr/registrations/:id/reject
// @access  Private (HR/Admin)
const rejectRegistration = async (req, res, next) => {
  try {
    const userToReject = await User.findById(req.params.id);

    if (!userToReject) {
      res.status(404);
      throw new Error('Registration request not found');
    }

    if (!req.body.reason || req.body.reason.trim().length === 0) {
      res.status(400);
      throw new Error('A rejection reason is required.');
    }

    userToReject.status = 'Inactive';
    userToReject.rejectionReason = req.body.reason;

    const updatedUser = await userToReject.save();
    res.json({
      _id: updatedUser._id,
      status: updatedUser.status,
      message: 'Staff registration request rejected.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get staff assigned to the logged-in Team Leader
// @route   GET /api/hr/my-staff
// @access  Private (Team Leader)
const getMyStaff = async (req, res, next) => {
  try {
    const tlUser = req.user;
    if (!tlUser) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const staffList = await User.find({
      status: 'Active',
      teamLeader: tlUser._id
    })
      .select('-password')
      .populate('department', 'name')
      .sort({ name: 1 });

    res.json(staffList);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints pending HR review
// @route   GET /api/hr/complaints
// @access  Private (HR/Admin)
const getHRComplaints = async (req, res, next) => {
  try {
    const Complaint = require('../models/Complaint');
    // HR can view all complaints across the organization
    const query = {};

    const complaints = await Complaint.find(query)
      .populate('createdBy', 'name employeeId')
      .populate('assignedTo', 'name role')
      .populate('assignedTeamLeader', 'name')
      .populate('departmentManager', 'name')
      .populate('responsibleDepartment')
      .sort({ updatedAt: -1 });
    res.json(complaints);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint by ID for HR
// @route   GET /api/hr/complaints/:id
// @access  Private (HR/Admin)
const getHRComplaintById = async (req, res, next) => {
  try {
    const Complaint = require('../models/Complaint');
    const { id } = req.params;
    let complaint;

    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id)
        .populate('createdBy', 'name employeeId role department')
        .populate('assignedTo', 'name role employeeId')
        .populate('assignedTeamLeader', 'name employeeId')
        .populate('departmentManager', 'name employeeId')
        .populate('responsibleDepartment', 'name');
    }
    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: id })
        .populate('createdBy', 'name employeeId role department')
        .populate('assignedTo', 'name role employeeId')
        .populate('assignedTeamLeader', 'name employeeId')
        .populate('departmentManager', 'name employeeId')
        .populate('responsibleDepartment', 'name');
    }

    if (!complaint) {
      res.status(404);
      throw new Error('Complaint not found');
    }

    res.json(complaint);
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status by HR
// @route   PUT /api/hr/complaints/:id/status
// @access  Private (HR/Admin)
const updateHRComplaintStatus = async (req, res, next) => {
  try {
    const Complaint = require('../models/Complaint');
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

    const newStatus = status || (action === 'accept' ? 'In Progress' : action === 'reject' ? 'Rejected' : complaint.status);
    complaint.status = newStatus;

    let timelineTitle = `Status changed to ${newStatus}`;
    if (action === 'accept' || newStatus === 'In Progress') {
      timelineTitle = 'Accepted by HR';
    } else if (action === 'reject' || newStatus === 'Rejected') {
      timelineTitle = 'Rejected by HR';
    } else if (newStatus === 'Resolved') {
      timelineTitle = 'Resolved by HR';
      complaint.resolvedDate = new Date();
    } else if (newStatus === 'Closed') {
      timelineTitle = 'Closed';
      complaint.closedDate = new Date();
    }

    complaint.timeline.push({
      title: timelineTitle,
      description: note || `Updated by HR ${req.user.name} (${req.user.employeeId || 'HR'})`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();
    if (newStatus === 'Resolved') {
      await notifyHRAndSuperAdminOnResolution(updated, req.user ? req.user.name : '');
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to complaint by HR
// @route   POST /api/hr/complaints/:id/comment
// @access  Private (HR/Admin)
const addHRComment = async (req, res, next) => {
  try {
    const Complaint = require('../models/Complaint');
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

    complaint.comments.push({
      senderName: req.user.name || 'HR Portal',
      senderRole: 'HR',
      message: commentText.trim(),
      createdAt: new Date()
    });

    complaint.timeline.push({
      title: 'HR Comment Added',
      description: `HR ${req.user.name} added a comment`,
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

// @desc    Submit HR resolution report
// @route   POST /api/hr/complaints/:id/resolve-report
// @access  Private (HR/Admin)
const submitHRResolutionReport = async (req, res, next) => {
  try {
    const Complaint = require('../models/Complaint');
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

    complaint.status = 'Resolved';
    complaint.resolvedDate = new Date();

    complaint.resolutionReports.push({
      solvedBy: req.user._id,
      solverName: req.user.name,
      solverRole: 'HR',
      reportText: reportText,
      forwardedTo: 'Super Admin',
      isReviewed: false
    });

    complaint.timeline.push({
      title: 'Resolution Report Submitted by HR',
      description: `HR ${req.user.name} solved the issue and submitted resolution report.`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();
    await notifyHRAndSuperAdminOnResolution(updated, req.user ? req.user.name : '');
    res.json({ message: 'Resolution report submitted successfully', complaint: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Escalate complaint from HR to Super Admin
// @route   PUT /api/hr/complaints/:id/escalate
// @access  Private (HR/Admin)
const escalateHRComplaintToSuperAdmin = async (req, res, next) => {
  try {
    const Complaint = require('../models/Complaint');
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

    complaint.status = 'Escalated to Super Admin';
    complaint.escalated = true;
    complaint.escalatedToSuperAdmin = true;

    complaint.timeline.push({
      title: 'Escalated to Super Admin',
      description: reason || `HR ${req.user.name} escalated complaint to Super Admin level.`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    });

    const updated = await complaint.save();
    res.json({ message: 'Complaint escalated to Super Admin successfully', complaint: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all staff salaries, incentives, and performance ratings
// @route   GET /api/hr/salaries
// @access  Private (HR/Admin)
const getSalaries = async (req, res, next) => {
  try {
    const Complaint = require('../models/Complaint');
    const users = await User.find({ status: 'Active' })
      .select('-password')
      .populate('department', 'name')
      .populate('teamLeader', 'name');

    const result = await Promise.all(
      users.map(async (u) => {
        // Query genuine resolved complaints where this user was assigned as resolver or submitted resolution
        let resolvedQuery = {};
        if (u.role === 'Staff') {
          // Staff only solved if assigned explicitly or in resolution report (NOT complainant)
          resolvedQuery = { 
            $or: [
              { assignedTo: u._id },
              { 'resolutionReports.solvedBy': u._id }
            ],
            status: { $in: ['Resolved', 'Closed', 'Approved'] }
          };
        } else if (u.role === 'Team Leader') {
          resolvedQuery = { 
            $or: [
              { assignedTeamLeader: u._id },
              { assignedTo: u._id },
              { 'resolutionReports.solvedBy': u._id }
            ],
            status: { $in: ['Resolved', 'Closed', 'Approved'] }
          };
        } else if (u.role === 'Manager') {
          resolvedQuery = { 
            $or: [
              { departmentManager: u._id },
              { assignedTo: u._id },
              { 'resolutionReports.solvedBy': u._id }
            ],
            status: { $in: ['Resolved', 'Closed', 'Approved'] }
          };
        } else {
          resolvedQuery = { _id: null };
        }

        const resolvedComplaints = (u.role === 'HR' || u.role === 'Super Admin')
          ? []
          : await Complaint.find(resolvedQuery)
              .select('complaintId subject category status priority feedbackRating resolvedDate updatedAt')
              .sort({ updatedAt: -1 })
              .limit(50);

        const resolvedCount = resolvedComplaints.filter(c =>
          c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Approved'
        ).length;

        // Base Salary Structure (Real configured values from DB)
        const baseSalary = Number(u.baseSalary || 0);
        const hra = Number(u.hra || 0);
        const allowances = Number(u.allowances || 0);
        const deductions = Number(u.deductions || 0);
        const netBaseSalary = Math.max(0, baseSalary + hra + allowances - deductions);
        const isSalaryConfigured = (baseSalary > 0 || hra > 0 || allowances > 0);

        // Separate Resolution Incentive Structure
        const incentiveRate = Number(u.incentiveRate || 500);
        const customIncentive = Number(u.customIncentive || 0);
        const earnedIncentive = (resolvedCount * incentiveRate) + customIncentive;

        // Avg rating from rated complaints
        const ratedComplaints = resolvedComplaints.filter(c => c.feedbackRating);
        const ratingsCount = ratedComplaints.length;
        const totalRating = ratedComplaints.reduce((sum, c) => sum + (c.feedbackRating || 0), 0);
        const averageRating = ratingsCount > 0 ? (totalRating / ratingsCount).toFixed(1) : 'N/A';

        let performance = 'N/A';
        if (averageRating !== 'N/A') {
          const avg = parseFloat(averageRating);
          if (avg >= 4.5) performance = 'Outstanding';
          else if (avg >= 4.0) performance = 'Excellent';
          else if (avg >= 3.0) performance = 'Satisfactory';
          else performance = 'Needs Improvement';
        } else if (resolvedCount > 0) {
          performance = resolvedCount >= 5 ? 'Excellent' : 'Satisfactory';
        }

        return {
          _id: u._id,
          employeeId: u.employeeId,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          department: u.department ? u.department.name : 'General',
          teamLeader: u.teamLeader ? u.teamLeader.name : 'None',
          
          // Salary Structure Details
          baseSalary,
          hra,
          allowances,
          deductions,
          netBaseSalary,
          isSalaryConfigured,
          salaryStatus: u.salaryStatus || 'Pending',
          salaryPaidDate: u.salaryPaidDate || null,
          salaryPaymentMethod: u.salaryPaymentMethod || 'Bank Transfer',
          salaryPaymentRef: u.salaryPaymentRef || '',

          // Separate Incentive Details
          resolvedCount,
          incentiveRate,
          customIncentive,
          earnedIncentive,
          incentiveStatus: u.incentiveStatus || 'Pending',
          incentivePaidDate: u.incentivePaidDate || null,
          incentivePaymentMethod: u.incentivePaymentMethod || 'Bank Transfer',
          incentivePaymentRef: u.incentivePaymentRef || '',

          // Performance
          performanceRating: averageRating,
          performanceLabel: performance,
          salaryNotes: u.salaryNotes || '',

          resolvedComplaints: resolvedComplaints.map(c => ({
            complaintId: c.complaintId,
            subject: c.subject,
            category: c.category,
            priority: c.priority || 'Medium',
            status: c.status,
            feedbackRating: c.feedbackRating || null,
            resolvedDate: c.resolvedDate || c.updatedAt
          }))
        };
      })
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user salary structure, incentives, or mark payments
// @route   PUT /api/hr/salaries/:id
// @access  Private (HR/Admin)
const updateSalary = async (req, res, next) => {
  try {
    const { 
      baseSalary,
      hra,
      allowances,
      deductions,
      salaryStatus,
      salaryPaidDate,
      salaryPaymentMethod,
      salaryPaymentRef,

      incentiveRate,
      customIncentive,
      incentiveStatus,
      incentivePaidDate,
      incentivePaymentMethod,
      incentivePaymentRef,

      salaryNotes
    } = req.body;
    
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      res.status(404);
      throw new Error('User not found');
    }

    if (baseSalary !== undefined) userToUpdate.baseSalary = Number(baseSalary);
    if (hra !== undefined) userToUpdate.hra = Number(hra);
    if (allowances !== undefined) userToUpdate.allowances = Number(allowances);
    if (deductions !== undefined) userToUpdate.deductions = Number(deductions);
    if (salaryStatus !== undefined) userToUpdate.salaryStatus = salaryStatus;
    if (salaryPaidDate !== undefined) userToUpdate.salaryPaidDate = salaryPaidDate ? new Date(salaryPaidDate) : new Date();
    if (salaryPaymentMethod !== undefined) userToUpdate.salaryPaymentMethod = salaryPaymentMethod;
    if (salaryPaymentRef !== undefined) userToUpdate.salaryPaymentRef = salaryPaymentRef;

    if (incentiveRate !== undefined) userToUpdate.incentiveRate = Number(incentiveRate);
    if (customIncentive !== undefined) userToUpdate.customIncentive = Number(customIncentive);
    if (incentiveStatus !== undefined) userToUpdate.incentiveStatus = incentiveStatus;
    if (incentivePaidDate !== undefined) userToUpdate.incentivePaidDate = incentivePaidDate ? new Date(incentivePaidDate) : new Date();
    if (incentivePaymentMethod !== undefined) userToUpdate.incentivePaymentMethod = incentivePaymentMethod;
    if (incentivePaymentRef !== undefined) userToUpdate.incentivePaymentRef = incentivePaymentRef;

    if (salaryNotes !== undefined) userToUpdate.salaryNotes = salaryNotes;

    await userToUpdate.save();

    res.json({
      message: 'Salary and incentive configuration updated successfully',
      user: {
        _id: userToUpdate._id,
        employeeId: userToUpdate.employeeId,
        name: userToUpdate.name,
        baseSalary: userToUpdate.baseSalary,
        hra: userToUpdate.hra,
        allowances: userToUpdate.allowances,
        deductions: userToUpdate.deductions,
        salaryStatus: userToUpdate.salaryStatus,
        incentiveRate: userToUpdate.incentiveRate,
        customIncentive: userToUpdate.customIncentive,
        incentiveStatus: userToUpdate.incentiveStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getTeamLeaders,
  createTeamLeader,
  updateTeamLeader,
  updateTeamLeaderStatus,
  getRegistrations,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  getMyStaff,
  getHRComplaints,
  getHRComplaintById,
  updateHRComplaintStatus,
  addHRComment,
  submitHRResolutionReport,
  escalateHRComplaintToSuperAdmin,
  getSalaries,
  updateSalary
};
