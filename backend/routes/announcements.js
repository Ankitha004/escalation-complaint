const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  togglePinAnnouncement,
  acknowledgeAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAnnouncements)
  .post(createAnnouncement);

router.route('/:id/pin')
  .put(togglePinAnnouncement);

router.route('/:id/acknowledge')
  .put(acknowledgeAnnouncement);

router.route('/:id')
  .delete(deleteAnnouncement);

module.exports = router;
