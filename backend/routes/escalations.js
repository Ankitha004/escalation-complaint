const express = require('express');
const router = express.Router();
const { getEscalations } = require('../controllers/escalationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getEscalations);

module.exports = router;
