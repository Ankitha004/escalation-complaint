const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(applyLeave)
  .get(authorize('Team Leader', 'HR', 'Super Admin', 'Manager'), getAllLeaves);

router.route('/my')
  .get(getMyLeaves);

router.route('/:id/status')
  .put(authorize('Team Leader', 'HR', 'Super Admin', 'Manager'), updateLeaveStatus);

module.exports = router;
