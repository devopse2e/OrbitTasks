const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Helper function to generate a JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// --- User Registration Controller ---
const register = async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const user = await User.create({
            email,
            password,
        });

        if (user) {
            const token = generateToken(user._id);
            res.status(201).json({
                _id: user._id,
                email: user.email,
                token: token,
            });
        } else {
            res.status(400).json({ error: 'Invalid user data.' });
        }
    } catch (error) {
        next(error);
    }
};

// --- User Login Controller ---
const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.comparePassword(password))) {
            const token = generateToken(user._id);
            res.json({
                _id: user._id,
                email: user.email,
                token: token,
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    } catch (error) {
        next(error);
    }
};

// --- Forgot Password Direct Controller ---
const forgotPasswordDirect = async (req, res, next) => {
    console.log("Forgot Password Direct hit:", req.body);
    const { email, newPassword, confirmPassword } = req.body;

    try {
        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully. You may now log in with your new password.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    forgotPasswordDirect, // add this to your route next!
};
