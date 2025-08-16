const express = require('express');
const router = express.Router();
const { parseTaskDetails } = require('../services/nlpService');

router.post('/parse-task-details', (req, res) => {
    console.log('Received /nlp/parse-task-details request body:', req.body);

    // Destructure with defaults
    const { taskTitle, timeZone = 'UTC' } = req.body;

    // Strong type check and validation
    if (typeof taskTitle !== 'string' || taskTitle.trim() === '') {
        return res.status(400).json({ 
            error: 'Bad Request: taskTitle is required and must be a non-empty string.',
            receivedBody: req.body
        });
    }

    // Optional: Validate timeZone as valid IANA
    try {
        new Intl.DateTimeFormat('en-US', { timeZone });
    } catch {
        console.warn(`Invalid timezone provided: ${timeZone}. Falling back to UTC.`);
        timeZone = 'UTC'; // Fallback to default
    }

    try {
        const parsedData = parseTaskDetails(taskTitle.trim(), timeZone);
        res.json(parsedData);
    } catch (error) {
        console.error('Error in nlpService while parsing task details:', error);
        res.status(500).json({ error: 'Failed to parse task details due to an internal error.' });
    }
});

module.exports = router;
