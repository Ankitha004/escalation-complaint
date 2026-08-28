const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  getComplaints,
  cancelComplaint,
  reopenComplaint,
  submitFeedback,
  triggerSlaCheck,
  extendSlaDeadline
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/trigger-sla-check').post(triggerSlaCheck);

router.route('/my')
  .get(getMyComplaints);

router.route('/')
  .post(createComplaint)
  .get(getComplaints);

router.route('/:id')
  .get(getComplaintById)
  .put(updateComplaint);

router.route('/:id/extend-sla').put(extendSlaDeadline);
router.route('/:id/cancel').put(cancelComplaint);
router.route('/:id/reopen').put(reopenComplaint);
router.route('/:id/feedback').put(submitFeedback);

module.exports = router;
