const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { 
  getDashboardStats,
  getTeamLeaders,
  createTeamLeader,
  updateTeamLeader,
  updateTeamLeaderStatus,
  getRegistrations, 
  getRegistrationById, 
  approveRegistration, 
  rejectRegistration,
  getMyStaff,
  getHRComplaints,
  getHRComplaintById,
  updateHRComplaintStatus,
  addHRComment,
  submitHRResolutionReport,
  escalateHRComplaintToSuperAdmin,
  getSalaries,
  updateSalary
} = require('../controllers/hrController');

// Protect all HR routes with JWT authentication
router.use(protect);

// Team Leader's own assigned staff
router.route('/my-staff')
  .get(authorize('Team Leader', 'HR', 'Super Admin', 'Manager'), getMyStaff);

// Statistics
router.route('/stats')
  .get(authorize('HR', 'Super Admin'), getDashboardStats);

// Complaints for HR Review
router.route('/complaints')
  .get(authorize('HR', 'Super Admin'), getHRComplaints);

router.route('/complaints/:id')
  .get(authorize('HR', 'Super Admin'), getHRComplaintById);

router.route('/complaints/:id/status')
  .put(authorize('HR', 'Super Admin'), updateHRComplaintStatus);

router.route('/complaints/:id/comment')
  .post(authorize('HR', 'Super Admin'), addHRComment);

router.route('/complaints/:id/resolve-report')
  .post(authorize('HR', 'Super Admin'), submitHRResolutionReport);

router.route('/complaints/:id/escalate')
  .put(authorize('HR', 'Super Admin'), escalateHRComplaintToSuperAdmin);

// Team Leaders Management
router.route('/team-leaders')
  .get(authorize('HR', 'Super Admin', 'Manager', 'Team Leader'), getTeamLeaders)
  .post(authorize('HR', 'Super Admin'), createTeamLeader);

router.route('/team-leaders/:id')
  .put(authorize('HR', 'Super Admin'), updateTeamLeader);

router.route('/team-leaders/:id/status')
  .put(authorize('HR', 'Super Admin'), updateTeamLeaderStatus);

// Registrations
router.route('/registrations')
  .get(authorize('HR', 'Super Admin'), getRegistrations);

router.route('/registrations/:id')
  .get(authorize('HR', 'Super Admin'), getRegistrationById);

router.route('/registrations/:id/approve')
  .put(authorize('HR', 'Super Admin'), approveRegistration);

router.route('/registrations/:id/reject')
  .put(authorize('HR', 'Super Admin'), rejectRegistration);

// Salary & Incentives Management
router.route('/salaries')
  .get(authorize('HR', 'Super Admin'), getSalaries);

router.route('/salaries/:id')
  .put(authorize('HR', 'Super Admin'), updateSalary);

module.exports = router;
