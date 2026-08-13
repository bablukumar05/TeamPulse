const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const { validateBody } = require('../middleware/validationMiddleware');
const { registerSchema, loginSchema } = require('../schemas/authSchemas');


router.post('/register', upload.single('resume'), validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/forgotpassword', authController.forgotPassword);
router.put('/resetpassword/:resettoken', authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, upload.single('avatar'), authController.updateProfile);

module.exports = router;
