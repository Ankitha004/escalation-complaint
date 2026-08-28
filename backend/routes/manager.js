const express = require('express');
const router = express.Router();
const {
  getMyDepartment,
  getManagerComplaints,
  getManagerComplaintById,
  reassignComplaint,
  approveResolution,
  closeComplaint,
  updateManagerStatus,
  addManagerComment,
  getTeamLeaderPerformance,
  forwardReportToHR,
  submitManagerResolutionReport
} = require('../controllers/managerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('Manager', 'Super Admin'));

router.route('/my-department')
  .get(getMyDepartment);

router.route('/tl-performance')
  .get(getTeamLeaderPerformance);

router.route('/complaints')
  .get(getManagerComplaints);

router.route('/complaints/:id')
  .get(getManagerComplaintById);

router.route('/complaints/:id/reassign')
  .put(reassignComplaint);

router.route('/complaints/:id/approve')
  .put(approveResolution);

router.route('/complaints/:id/close')
  .put(closeComplaint);

router.route('/complaints/:id/status')
  .put(updateManagerStatus);

router.route('/complaints/:id/comment')
  .post(addManagerComment);

router.route('/complaints/:id/forward-report')
  .put(forwardReportToHR);

router.route('/complaints/:id/resolve-report')
  .post(submitManagerResolutionReport);

module.exports = router;
