const express = require('express');
const router = express.Router();
const { createDepartment, getDepartments, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .post(protect, authorize('Super Admin'), createDepartment)
  .get(protect, getDepartments);

router.route('/:id')
  .put(protect, authorize('Super Admin'), updateDepartment)
  .delete(protect, authorize('Super Admin'), deleteDepartment);

module.exports = router;

