const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const { upload } = require('../middleware/uploadMiddleware');

router.post('/register', upload.single('resume'), authController.register);
router.post('/login', authController.login);
router.post('/forgotpassword', authController.forgotPassword);
router.put('/resetpassword/:resettoken', authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, upload.single('avatar'), authController.updateProfile);

module.exports = router;
