const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

const getTodayDateFormats = (d = new Date()) => {
  const isoDate = d.toISOString().split('T')[0];
  const localDate = d.toLocaleDateString();
  const enUsDate = d.toLocaleDateString('en-US');
  const enInDate = d.toLocaleDateString('en-IN');
  return Array.from(new Set([isoDate, localDate, enUsDate, enInDate]));
};

// @desc    Clock in or clock out
// @route   POST /api/attendance
// @access  Private
const recordAttendance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toLocaleDateString();
    const todayFormats = getTodayDateFormats();

    let attendance = await Attendance.findOne({ employee: userId, date: { $in: todayFormats } });

    if (attendance) {
      if (attendance.clockOut === 'In Progress') {
        attendance.clockOut = timeNow;
        await attendance.save();

        // Notify Team Leader & Department Manager about Clock Out
        const currentUser = await User.findById(userId);
        if (currentUser.teamLeader) {
          await createNotification(
            currentUser.teamLeader,
            `${currentUser.name} (${currentUser.role}) has clocked out at ${timeNow}.`
          );
        }
        if (currentUser.department) {
          const deptManagers = await User.find({
            department: currentUser.department,
            role: 'Manager',
            _id: { $ne: userId }
          }).select('_id');
          for (const mgr of deptManagers) {
            await createNotification(
              mgr._id,
              `${currentUser.name} (${currentUser.role}) has clocked out at ${timeNow}.`
            );
          }
        }

        res.json({ message: 'Clocked Out successfully. Your attendance has been updated and notified to your superior.', attendance });
      } else {
        res.status(400);
        throw new Error('Already clocked out for today');
      }
    } else {
      attendance = await Attendance.create({
        employee: userId,
        clockIn: timeNow,
        date: todayStr,
        status: 'Present',
      });

      // Notify Team Leader & Department Manager about Clock In
      const currentUser = await User.findById(userId);
      if (currentUser.teamLeader) {
        await createNotification(
          currentUser.teamLeader,
          `${currentUser.name} (${currentUser.role}) has clocked in at ${timeNow} for today.`
        );
      }
      if (currentUser.department) {
        const deptManagers = await User.find({
          department: currentUser.department,
          role: 'Manager',
          _id: { $ne: userId }
        }).select('_id');
        for (const mgr of deptManagers) {
          await createNotification(
            mgr._id,
            `${currentUser.name} (${currentUser.role}) has clocked in at ${timeNow} for today.`
          );
        }
      }

      res.status(201).json({ message: 'Clocked In successfully. Your attendance is marked and available to your superiors.', attendance });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's attendance for the logged-in user
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendance = async (req, res, next) => {
  try {
    const todayFormats = getTodayDateFormats();
    const attendance = await Attendance.findOne({ employee: req.user._id, date: { $in: todayFormats } });
    const totalDaysAttended = await Attendance.countDocuments({
      employee: req.user._id,
      status: { $in: ['Present', 'Late'] }
    });

    if (attendance) {
      const obj = attendance.toObject();
      obj.totalDaysAttended = totalDaysAttended;
      return res.json(obj);
    } else {
      return res.json({
        clockIn: '--:--',
        clockOut: '--:--',
        status: 'Not Clocked In',
        totalDaysAttended
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance of team members / subordinates for superiors
// @route   GET /api/attendance/team
// @access  Private (Team Leader, Manager, HR, Super Admin)
const getTeamAttendance = async (req, res, next) => {
  try {
    const role = req.user.role;
    const date = req.query.date || new Date().toLocaleDateString();

    let userQuery = { status: 'Active' };

    if (role === 'Team Leader') {
      userQuery = {
        status: 'Active',
        teamLeader: req.user._id
      };
    } else if (role === 'Manager') {
      if (req.user.department) {
        userQuery = { status: 'Active', department: req.user.department };
      } else {
        userQuery = { status: 'Active' };
      }
    } else if (role === 'HR' || role === 'Super Admin') {
      userQuery = { status: 'Active' };
    }

    const teamUsers = await User.find(userQuery)
      .select('name employeeId email role designation department teamLeader')
      .populate('department', 'name')
      .sort({ name: 1 });

    const userIds = teamUsers.map((u) => u._id);

    const attendanceRecords = await Attendance.find({
      employee: { $in: userIds },
      date: date
    });

    const attendanceCounts = await Attendance.aggregate([
      { $match: { employee: { $in: userIds }, status: { $in: ['Present', 'Late'] } } },
      { $group: { _id: '$employee', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    attendanceCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      attendanceMap[record.employee.toString()] = record;
    });

    const result = teamUsers.map((emp) => {
      const att = attendanceMap[emp._id.toString()];
      return {
        employee: {
          _id: emp._id,
          name: emp.name,
          employeeId: emp.employeeId,
          role: emp.role,
          designation: emp.designation,
          department: emp.department
        },
        date: date,
        clockIn: att ? att.clockIn : '--:--',
        clockOut: att ? att.clockOut : '--:--',
        status: att ? att.status : 'Not Clocked In',
        isClockedIn: att ? true : false,
        isClockedOut: att ? (att.clockOut && att.clockOut !== 'In Progress') : false,
        totalDaysAttended: countMap[emp._id.toString()] || 0
      };
    });

    const stats = {
      totalMembers: result.length,
      presentCount: result.filter((r) => r.isClockedIn).length,
      notClockedInCount: result.filter((r) => !r.isClockedIn).length,
      clockedOutCount: result.filter((r) => r.isClockedOut).length
    };

    res.json({
      date,
      stats,
      members: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance history (for logged-in user or superior)
// @route   GET /api/attendance/history
// @access  Private
const getAttendanceHistory = async (req, res, next) => {
  try {
    const targetUserId = req.query.employeeId || req.user._id;

    if (targetUserId.toString() !== req.user._id.toString() && !['Team Leader', 'Manager', 'HR', 'Super Admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized to view other employee attendance history');
    }

    const logs = await Attendance.find({ employee: targetUserId })
      .sort({ createdAt: -1 })
      .limit(30);

    const totalDaysAttended = await Attendance.countDocuments({
      employee: targetUserId,
      status: { $in: ['Present', 'Late'] }
    });

    res.json({
      logs,
      totalDaysAttended
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance logs across all users (HR & Super Admin)
// @route   GET /api/attendance/all
// @access  Private (HR, Super Admin)
const getAllAttendanceLogs = async (req, res, next) => {
  try {
    if (!['HR', 'Super Admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized to access all attendance logs');
    }

    const { date, search } = req.query;

    let query = {};
    if (date) {
      query.date = date;
    }

    const logs = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'name employeeId email role designation department',
        populate: { path: 'department', select: 'name' }
      })
      .sort({ createdAt: -1 });

    const attendanceCounts = await Attendance.aggregate([
      { $match: { status: { $in: ['Present', 'Late'] } } },
      { $group: { _id: '$employee', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    attendanceCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    let filtered = logs;
    if (search) {
      const q = search.toLowerCase();
      filtered = logs.filter(log => 
        (log.employee?.name || '').toLowerCase().includes(q) ||
        (log.employee?.employeeId || '').toLowerCase().includes(q) ||
        (log.employee?.email || '').toLowerCase().includes(q)
      );
    }

    const mappedLogs = filtered.map(log => {
      const obj = log.toObject();
      const empIdStr = log.employee?._id ? log.employee._id.toString() : '';
      obj.totalDaysAttended = countMap[empIdStr] || 0;
      return obj;
    });

    res.json(mappedLogs);
  } catch (error) {
    next(error);
  }
};

// @desc    Export attendance logs as CSV
// @route   GET /api/attendance/export
// @access  Private (HR, Super Admin)
const exportAttendanceCsv = async (req, res, next) => {
  try {
    if (!['HR', 'Super Admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized to export attendance logs');
    }

    const { date } = req.query;
    let query = {};
    if (date) query.date = date;

    const logs = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'name employeeId email role designation department',
        populate: { path: 'department', select: 'name' }
      })
      .sort({ createdAt: -1 });

    const headers = 'Employee ID,Name,Email,Role,Department,Date,Clock In,Clock Out,Status\n';
    const rows = logs.map(log => {
      const emp = log.employee || {};
      const deptName = emp.department?.name || emp.department || 'General';
      return `"${emp.employeeId || ''}","${emp.name || ''}","${emp.email || ''}","${emp.role || ''}","${deptName}","${log.date || ''}","${log.clockIn || ''}","${log.clockOut || ''}","${log.status || ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.csv`);
    res.status(200).send(headers + rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordAttendance,
  getTodayAttendance,
  getTeamAttendance,
  getAttendanceHistory,
  getAllAttendanceLogs,
  exportAttendanceCsv,
};




