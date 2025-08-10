// backend/src/routes/nlpRoutes.js
const express = require('express');
const router = express.Router();
const { parseTaskDetails } = require('../services/nlpService'); // Path to your new service

router.post('/parse-task-details', (req, res) => {
    const { taskTitle } = req.body;
    if (!taskTitle) {
        return res.status(400).json({ error: 'taskTitle is required' });
    }
    try {
        const parsedData = parseTaskDetails(taskTitle);
        res.json(parsedData);
    } catch (error) {
        console.error('Error parsing task details:', error);
        res.status(500).json({ error: 'Failed to parse task details' });
    }
});

module.exports = router;
