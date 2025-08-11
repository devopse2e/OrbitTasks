const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const todoRoutes = require('./src/routes/todoRoutes');
const nlpRoutes = require('./src/routes/nlpRoutes');
// FIX: Import the new authentication routes
const authRoutes = require('./src/routes/authRoutes');

const errorHandler = require('./src/middleware/errorHandler');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
/*
// Routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api', nlpRoutes);
*/
// Routes
app.use('/user', userRoutes);
app.use('/auth', authRoutes);
app.use('/todos', todoRoutes);
app.use('/nlp', nlpRoutes); // Giving nlpRoutes a specific, non-conflicting path



// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Ready check endpoint
app.get('/ready', (req, res) => {
    res.status(200).json({
        status: 'Ready',
        timestamp: new Date().toISOString()
    });
});
/*
// API routes
// FIX: Add the new authRoutes to the application's middleware stack
app.use('/api', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api', nlpRoutes);
*/
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Todo API is running!',
        version: '1.0.0',
        docs: '/api/todos'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📝 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
