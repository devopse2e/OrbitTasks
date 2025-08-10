const { parseTaskDetails } = require('../services/nlpService');

const testPhrases = [
  "Take medicine every day at 8am",
  "Water the plants weekly on Mondays",
  "Pay credit card bill monthly on the 5th",
  "Workout every weekday at 6pm",
  "Read a book 30 minutes daily until August 31st",
  "Go jogging daily at 7am until 20th of next month",
  "Backup files every Friday until Dec 31st",
  "Call Mom on Sundays"
];

testPhrases.forEach(phrase => {
  console.log('Input:', phrase);
  console.log('Output:', parseTaskDetails(phrase));
  console.log('---');
});
