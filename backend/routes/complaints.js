const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  updateComment,
  getComplaints,
  cancelComplaint,
  reopenComplaint,
  submitFeedback,
  triggerSlaCheck,
  extendSlaDeadline
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/trigger-sla-check').post(authorize('Super Admin', 'Manager', 'HR'), triggerSlaCheck);

router.route('/my')
  .get(getMyComplaints);

router.route('/')
  .post(createComplaint)
  .get(getComplaints);

router.route('/:id')
  .get(getComplaintById)
  .put(updateComplaint);

router.route('/:id/comments/:commentIndex').put(updateComment);
router.route('/:id/comment/:commentIndex').put(updateComment);

router.route('/:id/extend-sla').put(authorize('Super Admin'), extendSlaDeadline);
router.route('/:id/cancel').put(cancelComplaint);
router.route('/:id/reopen').put(reopenComplaint);
router.route('/:id/feedback').put(submitFeedback);

module.exports = router;
