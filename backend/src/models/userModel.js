const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address.'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: [8, 'Password must be at least 8 characters long.'],
        select: false
    },
    displayName: {
        type: String,
        trim: true,
        default: ''
    },
    dob: {
        type: Date,
        default: null
    },
    timezone: { // <-- Updated field with validation
        type: String,
        default: 'UTC', // Default to Coordinated Universal Time
        validate: {
            validator: function (value) {
                try {
                    // Validate as a valid IANA timezone
                    new Intl.DateTimeFormat('en-US', { timeZone: value });
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'Invalid timezone format. Must be a valid IANA timezone (e.g., "Asia/Kolkata").'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving if modified or new
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password on login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
