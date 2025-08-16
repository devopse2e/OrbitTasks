const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// GET /api/user/profile
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return all public user fields, including timezone
    res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      dob: user.dob,
      timezone: user.timezone, // <-- Return the timezone
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/user/profile
const updateUserProfile = async (req, res, next) => {
  try {
    // <-- Destructure timezone from the request body
    const { displayName, dob, timezone } = req.body || {};
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Update fields if they were provided in the request
    if (displayName !== undefined) user.displayName = displayName;
    if (dob !== undefined) user.dob = dob;
    if (timezone !== undefined) user.timezone = timezone; // <-- Update the timezone

    await user.save();

    const token = generateToken(user._id);

    // Return the updated user profile in the response
    res.json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      dob: user.dob,
      timezone: user.timezone, // <-- Return the updated timezone
      token,
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
    // We need to select the password field here since it's excluded by default
    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = password;
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
