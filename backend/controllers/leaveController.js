const Leave = require('../models/Leave');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createNotification } = require('../services/notificationService');

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

    const leave = await Leave.create({
      employee: req.user._id,
      type,
      startDate,
      endDate,
      reason,
      status: 'Pending Approval',
    });

    // Notify employee applicant
    await createNotification(
      req.user._id,
      `Your leave application for ${type} (${startDate} to ${endDate}) has been submitted for approval.`
    );

    // Notify Team Leader or Manager if assigned
    if (req.user.teamLeader) {
      await createNotification(
        req.user.teamLeader,
        `New leave application submitted by ${req.user.name} (${type}).`
      );
    }

    res.status(201).json({ message: 'Leave application submitted', leave });
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

    // Notify employee applicant
    if (leave.employee) {
      await createNotification(
        leave.employee,
        `Your leave application (${leave.type}) has been ${status} by ${req.user.name} (${req.user.role}).`
      );
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
    const leaves = await Leave.find({ employee: userId, status: 'Approved' });

    let casualUsed = 0;
    let sickUsed = 0;
    let earnedUsed = 0;

    leaves.forEach(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
      
      const leaveType = (l.type || '').toLowerCase();
      if (leaveType.includes('casual')) {
        casualUsed += diffDays;
      } else if (leaveType.includes('sick')) {
        sickUsed += diffDays;
      } else if (leaveType.includes('earned')) {
        earnedUsed += diffDays;
      } else {
        casualUsed += diffDays;
      }
    });

    const balances = {
      casual: { allocated: 12, used: casualUsed, remaining: Math.max(0, 12 - casualUsed) },
      sick: { allocated: 12, used: sickUsed, remaining: Math.max(0, 12 - sickUsed) },
      earned: { allocated: 15, used: earnedUsed, remaining: Math.max(0, 15 - earnedUsed) }
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
