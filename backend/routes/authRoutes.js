const express = require('express');
const router = express.Router();
const {
  register,
  login,
  demoLogin,
  getMe,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  refreshSession,
  logoutUser
} = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.post('/refresh', refreshSession);
router.post('/logout', optionalProtect, logoutUser);
router.get('/me', protect, getMe);

// Forgot Password with OTP Lifecycle
router.post('/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOtp);
router.post('/forgot-password/reset-password', forgotPasswordReset);

module.exports = router;
