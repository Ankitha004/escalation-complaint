const express = require('express');
const router = express.Router();
const { login, register, getMe, changePassword, uploadMyCv } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/upload-cv', protect, upload.single('cv'), uploadMyCv);

module.exports = router;
