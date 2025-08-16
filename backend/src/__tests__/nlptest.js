// nlptest.js - Updated to Jest format similar to controllertest.js

process.env.PORT = 3002; // Not needed for tests, but keeping for consistency

const { parseTaskDetails } = require('../services/nlpService');

// Mock any dependencies if needed (e.g., date-fns or chrono-node), but for pure function testing, not necessary

describe('NLP Service Tests - parseTaskDetails', () => {
  // Array of test phrases covering various patterns
  const testPhrases = [
    // 🚀 Daily patterns
    { input: "Take medicine every day at 8am", expected: { recurrencePattern: 'daily', recurrenceInterval: 1, dueTime: '8:00 AM' } },
    { input: "Go jogging every 2 days", expected: { recurrencePattern: 'daily', recurrenceInterval: 2 } },
    { input: "Read a book 30 minutes daily until August 31st", expected: { recurrencePattern: 'daily', recurrenceInterval: 1, recurrenceEndsAt: expect.any(String) } }, // Check for end date
    { input: "Daily standup meeting at 10am", expected: { recurrencePattern: 'daily', recurrenceInterval: 1, dueTime: '10:00 AM' } },

    // 🚀 Weekly patterns
    { input: "Water the plants weekly on Mondays", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1 } },
    { input: "Team meeting every 2 weeks", expected: { recurrencePattern: 'weekly', recurrenceInterval: 2 } },
    { input: "Visit grandma every 3 weeks", expected: { recurrencePattern: 'weekly', recurrenceInterval: 3 } },
    { input: "Backup files every Friday until Dec 31st", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1, recurrenceEndsAt: expect.any(String) } },
    { input: "Grocery shopping every Saturday", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1 } },
    { input: "Meet Sarah on Mondays", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1 } },
    { input: "Call Mom on Sundays", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1 } },
    { input: "Check emails every weekday", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1 } },
    { input: "Work on project weekdays", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1 } },
    { input: "Weekly status call", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1 } },

    // 🚀 Monthly patterns
    { input: "Pay credit card bill monthly on the 5th", expected: { recurrencePattern: 'monthly', recurrenceInterval: 1 } },
    { input: "Pay bills every 2 months", expected: { recurrencePattern: 'monthly', recurrenceInterval: 2 } },
    { input: "Inspection every 6 months", expected: { recurrencePattern: 'monthly', recurrenceInterval: 6 } },
    { input: "Monthly finance review", expected: { recurrencePattern: 'monthly', recurrenceInterval: 1 } },

    // 🚀 Yearly patterns
    { input: "Yearly health checkup", expected: { recurrencePattern: 'yearly', recurrenceInterval: 1 } },
    { input: "Annually file taxes", expected: { recurrencePattern: 'yearly', recurrenceInterval: 1 } },
    { input: "Every year plant new flowers", expected: { recurrencePattern: 'yearly', recurrenceInterval: 1 } },

    // 🚀 Custom / Ordinal patterns
    { input: "Every first Monday", expected: { recurrencePattern: 'custom' } },
    { input: "Every last Friday", expected: { recurrencePattern: 'custom' } },
    { input: "Every third Wednesday", expected: { recurrencePattern: 'custom' } },
/*
    // 🚀 Month-name patterns (custom)
    { input: "Every March conference", expected: { recurrencePattern: 'custom', recurrenceInterval: 1 } },
    { input: "Every August family trip", expected: { recurrencePattern: 'custom', recurrenceInterval: 1 } },
    { input: "Monthly in June company retreat", expected: { recurrencePattern: 'custom', recurrenceInterval: 1 } },
    { input: "In December prepare budget", expected: { recurrencePattern: 'custom', recurrenceInterval: 1 } },
    { input: "December vacation", expected: { recurrencePattern: 'custom', recurrenceInterval: 1 } },
    { input: "Meeting in July", expected: { recurrencePattern: 'custom', recurrenceInterval: 1 } },
*/
    // NEW: Additional phrases to test current NLP (times, priorities, end dates, combinations)
    { input: "Prepare report daily at 9pm until Dec 31", expected: { recurrencePattern: 'daily', recurrenceInterval: 1, dueTime: '9:00 PM', recurrenceEndsAt: expect.any(String) } },
    { input: "High priority task weekly", expected: { priority: 'High', recurrencePattern: 'weekly', recurrenceInterval: 1 } },
    { input: "Bi-weekly review meeting", expected: { recurrencePattern: 'weekly', recurrenceInterval: 2 } },
    { input: "Exercise every other day", expected: { recurrencePattern: 'daily', recurrenceInterval: 2 } },
    { input: "Annual conference every 2 years", expected: { recurrencePattern: 'yearly', recurrenceInterval: 2 } },
    { input: "No recurrence task at 3pm", expected: { recurrencePattern: 'none', dueTime: '3:00 PM' } },
    { input: "Task with low priority monthly", expected: { priority: 'Low', recurrencePattern: 'monthly', recurrenceInterval: 1 } },
    { input: "Remind me to call every Tuesday until next month", expected: { recurrencePattern: 'weekly', recurrenceInterval: 1, recurrenceEndsAt: expect.any(String) } },

    // NEW: More edge cases for robustness
    { input: "Task without time or recurrence", expected: { recurrencePattern: 'none', dueTime: null } },
    { input: "Every day starting next week", expected: { recurrencePattern: 'daily', recurrenceInterval: 1 } },
    { input: "Bi monthly payment", expected: { recurrencePattern: 'monthly', recurrenceInterval: 2 } }, // Test "bi monthly"
    { input: "Urgent task high priority daily", expected: { priority: 'High', recurrencePattern: 'daily', recurrenceInterval: 1 } },
    { input: "Endless recurring task every day", expected: { recurrencePattern: 'daily', recurrenceInterval: 1, recurrenceEndsAt: null } },
    { input: "Task on the 15th of every month", expected: { recurrencePattern: 'monthly', recurrenceInterval: 1 } },
  ];

  testPhrases.forEach(({ input, expected }) => {
    test(`parses "${input}" correctly`, () => {
      const result = parseTaskDetails(input, 'Asia/Kolkata'); // Assuming default timezone for tests; adjust if needed

      // Assert key expectations
      if (expected.recurrencePattern) {
        expect(result.recurrencePattern).toBe(expected.recurrencePattern);
      }
      if (expected.recurrenceInterval) {
        expect(result.recurrenceInterval).toBe(expected.recurrenceInterval);
      }
      if (expected.dueTime) {
        // Extract time from dueDate if present (assuming dueDate includes time)
        const dueDateTime = result.dueDate ? new Date(result.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null;
        expect(dueDateTime).toContain(expected.dueTime);
      }
      if (expected.recurrenceEndsAt) {
        expect(result.recurrenceEndsAt).not.toBeNull();
      }
      if (expected.priority) {
        expect(result.priority).toBe(expected.priority);
      }

      // Optional: Log for manual review
      console.log(`Test: ${input} ->`, {
        recurrencePattern: result.recurrencePattern,
        recurrenceInterval: result.recurrenceInterval,
        dueDate: result.dueDate,
        recurrenceEndsAt: result.recurrenceEndsAt,
        cleanedTitle: result.cleanedTitle,
        priority: result.priority
      });
    });
  });
});
