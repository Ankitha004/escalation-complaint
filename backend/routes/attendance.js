const express = require('express');
const router = express.Router();
const {
  recordAttendance,
  getTodayAttendance,
  getTeamAttendance,
  getAttendanceHistory,
  getAllAttendanceLogs,
  exportAttendanceCsv,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(recordAttendance);

router.route('/today')
  .get(getTodayAttendance);

router.route('/team')
  .get(getTeamAttendance);

router.route('/history')
  .get(getAttendanceHistory);

router.route('/all')
  .get(getAllAttendanceLogs);

router.route('/export')
  .get(exportAttendanceCsv);

module.exports = router;



