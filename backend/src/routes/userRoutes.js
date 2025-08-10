// /src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
//const { updateUserProfile } = require('../controllers/userController');
const { getUserProfile, updateUserProfile,updateUserPassword } = require('../controllers/userController');
const { validatePasswordUpdate } = require('../middleware/validation');
const { protect } = require('../middleware/auth'); // Your auth middleware

// PUT /api/user/profile - Update user profile (displayName, dob, etc.)
router.put('/profile', protect, updateUserProfile);
router.get('/profile', protect, getUserProfile);
router.put('/password', protect,validatePasswordUpdate, updateUserPassword);
module.exports = router;
