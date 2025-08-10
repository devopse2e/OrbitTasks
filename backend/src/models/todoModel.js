const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    // FIX: Add a reference to the User model.
    // This is the most critical field for associating a todo with a specific user.
    userId: {
        type: mongoose.Schema.Types.ObjectId, // This will store the unique ID of a user.
        ref: 'User', // This tells Mongoose that the ID refers to a document in the 'User' collection.
        required: true, // Every todo MUST belong to a user.
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    completed: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 400,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    },
    dueDate: {
        type: Date,
        required: false,
        default: null
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        required: true,
        default: 'Medium'
    },
    completedAt: {
        type: Date,
        default: null
    },
    category: {
        type: String,
        trim: true,
        default: 'Personal',
        enum: ['Home', 'Work', 'Sports', 'Activity', 'Groceries', 'Shopping', 'Health', 'Finance', 'Personal', 'Others']
    },
    color: {
        type: String,
        trim: true,
        default: '#FFFFFF'
    },
    // Recurring Tasks
    isRecurring: {
        type: Boolean,
        default: false,
        required: true,
    },

    recurrencePattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom', 'none'],
        default: 'none',
    },
    recurrenceInterval: {
        type: Number,
        default: 1, // Default interval is 1 (e.g. every 1 day/week)
        min: 1
      },

    recurrenceCustomRule: {
        type: String,
        trim: true,
        default: '', // For storing complex or custom recurrence rules if needed
    },

    recurrenceEndsAt: {
        type: Date,
        default: null, // Null means no end date, recurs indefinitely
    },

    originalTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Todo',
        default: null, // If this task is a recurring instance derived from another task
    },

    nextDueDate: {
        type: Date,
        default: null, // For quick access to the next due date in recurring series
    }
});

// TTL index for auto-deletion of completed items
todoSchema.index({ completedAt: 1 }, { expireAfterSeconds: 86400 });

// Compound index for efficient querying of user-specific todos
todoSchema.index({ userId: 1, createdAt: -1 });

// Pre-hook to update the 'updatedAt' field on each save
todoSchema.pre('save', function(next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
