// /src/controllers/userController.js

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // to hash passwords securely

// Helper to generate JWT token (reuse from authController)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// GET /api/user/profile
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // set by your auth middleware

    const user = await User.findById(userId).select('-password'); // exclude sensitive fields like password

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// PUT /api/user/profile
const updateUserProfile = async (req, res, next) => {
  try {
    const { displayName, dob } = req.body || {};
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (displayName !== undefined) user.displayName = displayName;
    if (dob !== undefined) user.dob = dob;

    await user.save();

    // Generate a new token (optional), to keep authentication fresh
    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      dob: user.dob,
      token, // Return token so frontend can update it if needed
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/user/password
const updateUserPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!confirmPassword || password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = password;   // <---- Let pre-save hook hash it once
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};



module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
};
