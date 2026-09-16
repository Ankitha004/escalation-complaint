const Leave = require('../models/Leave');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createNotification } = require('../services/notificationService');

// Helper to calculate leave duration in days
const calculateDays = (startDate, endDate) => {
  const s = new Date(startDate);
  const e = new Date(endDate);
  // Normalize to UTC dates to avoid time offset issues
  const utc1 = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const utc2 = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
  const diffDays = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      res.status(400);
      throw new Error('All fields are required');
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    if (endObj < startObj) {
      res.status(400);
      throw new Error('End date cannot be earlier than start date');
    }

    const requestedDays = calculateDays(startDate, endDate);

    // Yearly Leave Quotas: Total 12 yearly (6 Earned Leave, 6 Medical/Sick Leave)
    // Validate quota remaining for the current calendar year
    const currentYear = startObj.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const existingLeaves = await Leave.find({
      employee: req.user._id,
      status: { $in: ['Approved', 'Pending Approval', 'Pending Team Leader Approval'] },
      startDate: { $gte: yearStart, $lte: yearEnd }
    });

    const isEmergency = type.toLowerCase().includes('emergency');
    const isMedical = type.toLowerCase().includes('medical') || type.toLowerCase().includes('sick');
    const isEarned = type.toLowerCase().includes('earned') || type.toLowerCase().includes('el');

    let usedMedical = 0;
    let usedEarned = 0;

    existingLeaves.forEach(l => {
      const days = calculateDays(l.startDate, l.endDate);
      const t = (l.type || '').toLowerCase();
      if (t.includes('medical') || t.includes('sick')) {
        usedMedical += days;
      } else if (!t.includes('emergency')) {
        // Earned Leave / Casual Leave counts towards EL
        usedEarned += days;
      }
    });

    const MAX_EL = 6;
    const MAX_MEDICAL = 6;
    const TOTAL_QUOTA = MAX_EL + MAX_MEDICAL; // 12 days

    let deductionDays = 0;
    let salaryDeductionAmount = 0;

    // Fetch employee details to calculate per-day salary deduction
    const applicantUser = await User.findById(req.user._id);
    const baseMonthlySalary = (applicantUser && applicantUser.baseSalary && applicantUser.baseSalary > 0)
      ? applicantUser.baseSalary
      : 30000; // Standard baseline if unconfigured
    const dailyRate = Math.round(baseMonthlySalary / 30);

    if (isEmergency) {
      // Calculate available total regular quota remaining
      const elRemaining = Math.max(0, MAX_EL - usedEarned);
      const medRemaining = Math.max(0, MAX_MEDICAL - usedMedical);
      const totalRemaining = elRemaining + medRemaining;

      // If requested days exceed remaining annual quota days, excess days incur salary deduction
      if (requestedDays > totalRemaining) {
        deductionDays = requestedDays - totalRemaining;
        salaryDeductionAmount = deductionDays * dailyRate;
      }
    } else if (isMedical) {
      if (usedMedical + requestedDays > MAX_MEDICAL) {
        const remaining = Math.max(0, MAX_MEDICAL - usedMedical);
        res.status(400);
        throw new Error(`Medical Leave quota limit reached! You have ${remaining} day(s) remaining out of ${MAX_MEDICAL} days allocated yearly. (Requested: ${requestedDays} day(s)). Please apply for Emergency Leave if you require additional leave days.`);
      }
    } else {
      // Earned Leave (EL)
      if (usedEarned + requestedDays > MAX_EL) {
        const remaining = Math.max(0, MAX_EL - usedEarned);
        res.status(400);
        throw new Error(`Earned Leave (EL) quota limit reached! You have ${remaining} day(s) remaining out of ${MAX_EL} days allocated yearly. (Requested: ${requestedDays} day(s)). Please apply for Emergency Leave if you require additional leave days.`);
      }
    }

    const leave = await Leave.create({
      employee: req.user._id,
      type,
      startDate,
      endDate,
      reason,
      status: 'Pending Approval',
      isEmergencyLeave: isEmergency,
      deductionDays,
      salaryDeductionAmount,
    });

    // Notify employee applicant
    let applicantNotifMsg = `Your leave application for ${type} (${startDate} to ${endDate}) has been submitted for approval.`;
    if (isEmergency && deductionDays > 0) {
      applicantNotifMsg += ` Notice: Because this application extends your available annual leave quota by ${deductionDays} day(s), a salary deduction of ₹${salaryDeductionAmount.toLocaleString('en-IN')} (₹${dailyRate}/day for ${deductionDays} days) will be deducted from your salary upon approval.`;
    }

    await createNotification(
      req.user._id,
      applicantNotifMsg
    );

    // Notify Team Leader or Manager if assigned
    if (req.user.teamLeader) {
      let tlNotifMsg = `New leave application submitted by ${req.user.name} (${type}).`;
      if (isEmergency && deductionDays > 0) {
        tlNotifMsg += ` Note: Extends annual leave quota by ${deductionDays} day(s) with salary deduction of ₹${salaryDeductionAmount.toLocaleString('en-IN')}.`;
      }
      await createNotification(
        req.user.teamLeader,
        tlNotifMsg
      );
    }

    res.status(201).json({
      message: isEmergency && deductionDays > 0
        ? `Emergency leave submitted. Note: ${deductionDays} day(s) exceed your quota and ₹${salaryDeductionAmount.toLocaleString('en-IN')} will be deducted from your salary.`
        : 'Leave application submitted successfully',
      leave,
      deductionDays,
      salaryDeductionAmount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's leave requests
// @route   GET /api/leaves/my
// @access  Private
const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaves for approval based on role
// @route   GET /api/leaves
// @access  Private (Team Leader, Manager, HR, Super Admin)
const getAllLeaves = async (req, res, next) => {
  try {
    const role = req.user.role;
    let query = {};

    if (role === 'HR' || role === 'Super Admin') {
      query = {};
    } else if (role === 'Manager') {
      const staffInDept = await User.find({ department: req.user.department }).select('_id');
      const staffIds = staffInDept.map(u => u._id);
      query = { employee: { $in: staffIds } };
    } else if (role === 'Team Leader') {
      const staffInTeam = await User.find({
        teamLeader: req.user._id
      }).select('_id');
      const staffIds = staffInTeam.map(u => u._id);
      query = { employee: { $in: staffIds } };
    } else {
      res.status(403);
      throw new Error('Not authorized to access leave approval');
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'name employeeId role department')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/status
// @access  Private (Team Leader, Manager, HR, Super Admin)
const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      res.status(400);
      throw new Error('Invalid leave status. Must be Approved or Rejected');
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404);
      throw new Error('Leave application not found');
    }

    const role = req.user.role;
    let isAuthorized = false;

    if (role === 'HR' || role === 'Super Admin') {
      isAuthorized = true;
    } else {
      const applicant = await User.findById(leave.employee);
      if (!applicant) {
        res.status(404);
        throw new Error('Applicant employee not found');
      }

      if (role === 'Manager') {
        if (applicant.department && applicant.department.toString() === req.user.department.toString()) {
          isAuthorized = true;
        }
      } else if (role === 'Team Leader') {
        if (applicant.teamLeader && applicant.teamLeader.toString() === req.user._id.toString()) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      res.status(403);
      throw new Error('Not authorized to update this leave application');
    }

    leave.status = status;
    await leave.save();

    // If approved and has salary deduction, apply deduction to user's record
    if (status === 'Approved' && leave.salaryDeductionAmount > 0) {
      await User.findByIdAndUpdate(leave.employee, {
        $inc: { deductions: leave.salaryDeductionAmount }
      });
    }

    // Notify employee applicant
    if (leave.employee) {
      let notifMsg = `Your leave application (${leave.type}) has been ${status} by ${req.user.name} (${req.user.role}).`;
      if (status === 'Approved' && leave.deductionDays > 0) {
        notifMsg += ` Salary Deduction Applied: ₹${leave.salaryDeductionAmount.toLocaleString('en-IN')} will be deducted from this month's salary for ${leave.deductionDays} day(s) exceeding your annual leave quota.`;
      }
      await createNotification(leave.employee, notifMsg);
    }

    res.json({ message: `Leave status updated to ${status}`, leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's leave balance quotas
// @route   GET /api/leaves/balances
// @access  Private
const getLeaveBalances = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const leaves = await Leave.find({
      employee: userId,
      startDate: { $gte: yearStart, $lte: yearEnd }
    });

    let earnedUsed = 0;
    let earnedPending = 0;
    let medicalUsed = 0;
    let medicalPending = 0;

    leaves.forEach(l => {
      const days = calculateDays(l.startDate, l.endDate);
      const leaveType = (l.type || '').toLowerCase();
      const isApproved = l.status === 'Approved';
      const isPending = l.status?.startsWith('Pending');

      if (leaveType.includes('medical') || leaveType.includes('sick')) {
        if (isApproved) medicalUsed += days;
        if (isPending) medicalPending += days;
      } else {
        // Earned leave (EL) or Casual
        if (isApproved) earnedUsed += days;
        if (isPending) earnedPending += days;
      }
    });

    const MAX_EL = 6;
    const MAX_MEDICAL = 6;
    const TOTAL_ANNUAL = MAX_EL + MAX_MEDICAL; // 12

    const totalUsed = earnedUsed + medicalUsed;
    const totalPending = earnedPending + medicalPending;
    const totalRemaining = Math.max(0, TOTAL_ANNUAL - totalUsed);

    const balances = {
      year: currentYear,
      totalLimit: TOTAL_ANNUAL,
      totalUsed,
      totalRemaining,
      totalPending,
      earnedLeave: {
        code: 'EL',
        label: 'Earned Leave (EL)',
        allocated: MAX_EL,
        used: earnedUsed,
        pending: earnedPending,
        remaining: Math.max(0, MAX_EL - earnedUsed)
      },
      medicalLeave: {
        code: 'ML',
        label: 'Medical Leave',
        allocated: MAX_MEDICAL,
        used: medicalUsed,
        pending: medicalPending,
        remaining: Math.max(0, MAX_MEDICAL - medicalUsed)
      }
    };

    res.json(balances);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveBalances
};
