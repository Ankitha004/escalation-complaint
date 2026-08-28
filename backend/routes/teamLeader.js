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

router.use(protect);

router.route('/complaints')
  .get(getTLComplaints);

router.route('/my-staff')
  .get(getTLMyStaff);

router.route('/complaints/:id')
  .get(getTLComplaintById);

router.route('/complaints/:id/status')
  .put(updateTLComplaintStatus);

router.route('/complaints/:id/comment')
  .post(addTLComment);

router.route('/complaints/:id/resolve-report')
  .post(submitResolutionReport);

router.route('/complaints/:id/escalate')
  .put(manualEscalate);

module.exports = router;
