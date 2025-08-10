const express = require('express');
const router = express.Router();

// Import all required controllers
const { register, login, forgotPasswordDirect } = require('../controllers/authController');
const { validateRegistration,validateForgotPasswordDirect, validateLogin } = require('../middleware/validation');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST api/auth/forgot-password-direct
// @desc    Reset password directly by email and new password (for login screen forgot password)
// @access  Public
router.post('/forgot-password-direct', validateForgotPasswordDirect, forgotPasswordDirect);

module.exports = router;
