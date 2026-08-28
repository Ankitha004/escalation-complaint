const Attendance = require('../models/Attendance');

// @desc    Clock in or clock out
// @route   POST /api/attendance
// @access  Private
const recordAttendance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = new Date().toLocaleDateString();

    let attendance = await Attendance.findOne({ employee: userId, date: today });

    if (attendance) {
      if (attendance.clockOut === 'In Progress') {
        attendance.clockOut = timeNow;
        await attendance.save();
        res.json({ message: 'Clocked Out successfully', attendance });
      } else {
        res.status(400);
        throw new Error('Already clocked out for today');
      }
    } else {
      attendance = await Attendance.create({
        employee: userId,
        clockIn: timeNow,
        date: today,
        status: 'Present',
      });
      res.status(201).json({ message: 'Clocked In successfully', attendance });
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
    const today = new Date().toLocaleDateString();
    const attendance = await Attendance.findOne({ employee: req.user._id, date: today });
    res.json(attendance || null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordAttendance,
  getTodayAttendance,
};
