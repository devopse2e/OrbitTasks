const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    // Check if the token is sent in the 'Authorization' header and is a Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Get token from header (e.g., "Bearer <token>" -> "<token>")
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the token's signature
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Get user from the database using the ID from the token
            // We attach the user to the request object, excluding the password
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                // Handle case where user associated with token no longer exists
                return res.status(401).json({ error: 'Not authorized, user not found.' });
            }

            // 4. Proceed to the next middleware or the route handler
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ error: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided.' });
    }
};

module.exports = { protect };
