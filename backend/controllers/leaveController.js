const Leave = require('../models/Leave');
const User = require('../models/User');
const mongoose = require('mongoose');

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

    res.json({ message: `Leave status updated to ${status}`, leave });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus
};
