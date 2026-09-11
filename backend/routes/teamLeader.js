const express = require('express');
const router = express.Router();
const {
  getTLComplaints,
  getTLMyStaff,
  getTLComplaintById,
  updateTLComplaintStatus,
  addTLComment,
  submitResolutionReport,
  manualEscalate
} = require('../controllers/teamLeaderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('Team Leader', 'Super Admin'));

router.route('/complaints')
  .get(getTLComplaints);

router.route('/my-staff')
  .get(getTLMyStaff);

router.route('/complaints/:id')
  .get(getTLComplaintById);

router.route('/complaints/:id/status')
  .put(updateTLComplaintStatus);

router.route('/complaints/:id/comment')
  .post(addTLComment)
  .put(addTLComment);

router.route('/complaints/:id/resolve-report')
  .post(submitResolutionReport);

router.route('/complaints/:id/escalate')
  .put(manualEscalate);

module.exports = router;
