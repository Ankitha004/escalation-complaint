const express = require('express');
const router = express.Router();
const { getGlobalStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/stats')
  .get(protect, authorize('Super Admin'), getGlobalStats);

module.exports = router;
