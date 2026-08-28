const express = require('express');
const router = express.Router();
const { createUser, getUsers, updateUserStatus, updateUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .post(protect, authorize('HR', 'Super Admin'), createUser)
  .get(protect, authorize('HR', 'Super Admin', 'Manager'), getUsers);

router.route('/:id')
  .put(protect, authorize('HR', 'Super Admin'), updateUser);

router.route('/:id/status')
  .put(protect, authorize('HR', 'Super Admin'), updateUserStatus);

module.exports = router;
