const express = require('express');
const router = express.Router();
const { recordAttendance, getTodayAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(recordAttendance);

router.route('/today')
  .get(getTodayAttendance);

module.exports = router;
