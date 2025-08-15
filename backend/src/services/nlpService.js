const chrono = require('chrono-node');

// --- Constants and Regular Expressions ---
const monthNames = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];
const monthNamesShort = monthNames.map(m => m.slice(0, 3));
const monthNamesRegexPart = [...monthNamesShort, ...monthNames].join('|');

// Recurrence patterns
const recurrencePatterns = [
  { pattern: /\bbi[-\s]?weekly\b/gi, recurrencePattern: 'weekly', interval: 2 },
  { pattern: /\bevery\s+(\d+)\s+day(s)?\b/gi, recurrencePattern: 'daily', extractInterval: true },
  { pattern: /\bevery\s+(\d+)\s+week(s)?\b/gi, recurrencePattern: 'weekly', extractInterval: true },
  { pattern: /\bevery\s+(\d+)\s+month(s)?\b/gi, recurrencePattern: 'monthly', extractInterval: true },
  { pattern: /\bevery\s+(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/gi, recurrencePattern: 'custom' },
  { pattern: /\bevery\s+weekday(s)?\b/gi, recurrencePattern: 'weekly', interval: 1 },
  { pattern: /\bweekdays?\b/gi, recurrencePattern: 'weekly', interval: 1 },
  { pattern: /\b(every|on)\s+(Mondays?|Tuesdays?|Wednesdays?|Thursdays?|Fridays?|Saturdays?|Sundays?)\b/gi, recurrencePattern: 'weekly', interval: 1 },
  { pattern: /\b(daily|every day)\b/gi, recurrencePattern: 'daily', interval: 1 },
  { pattern: /\bweekly\b/gi, recurrencePattern: 'weekly', interval: 1 },
  { pattern: /\bmonthly\b/gi, recurrencePattern: 'monthly', interval: 1 },
  { pattern: /\b(yearly|annually|every\s+year)\b/gi, recurrencePattern: 'yearly', interval: 1 },
  { pattern: new RegExp(`\\bevery\\s+(${monthNamesRegexPart})(s)?\\b`, 'gi'), recurrencePattern: 'custom', interval: 1 },
  { pattern: new RegExp(`\\b(monthly)?\\s*(in)?\\s+(${monthNamesRegexPart})\\b`, 'gi'), recurrencePattern: 'custom', interval: 1 },
  { pattern: new RegExp(`\\b(${monthNamesRegexPart})\\b`, 'gi'), recurrencePattern: 'custom', interval: 1 },
];

const startDatePatterns = [
  /\b(starting|beginning|from)\s+(mid(?:dle)?|end(?:ing)?|\d{1,2}(st|nd|rd|th)?|next|this|current|coming)?\s*(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\b[\w\s]*/gi,
];

const alwaysClean = [
  /repeat\s*this\s*task/gi,
  /remind\s*me/gi,
  /\btill\b/gi,
  /\btil\b/gi,
  /\buntil\b/gi,
  /\buntill\b/gi,
  /starting\b/gi,
  /beginning\b/gi,
  /\bfor\s+next\s+\d+\s+(day|week|month|year)s?\b/gi,
  /\bbi[-\s]?weekly\b/gi,
  /\bhigh\s*priority\b/gi,
  /\bmedium\s*priority\b/gi,
  /\blow\s*priority\b/gi,
  /\bwith\s+high\b/gi,
  /\bwith\s+medium\b/gi,
  /\bwith\s+low\b/gi,
  /\bon\s+high\b/gi,
  /\bon\s+medium\b/gi,
  /\bon\s+low\b/gi
];


const monthWordsPattern = new RegExp(`\\b(${monthNames.join('|')})\\b`, 'gi');
const timePattern = /\b((at|by|on)\s*)?(\d{1,2}(:\d{2})?\s*(am|pm))\b/gi;

// --- Helpers ---
const detectPriority = (text) => {
  const lowerText = text.toLowerCase();
  if (/\b(high\s*priority|urgent|with\s+high|on\s+high)\b/.test(lowerText)) return 'High';
  if (/\b(medium\s*priority|normal\s*priority|with\s+medium|on\s+medium)\b/.test(lowerText)) return 'Medium';
  if (/\b(low\s*priority|with\s+low|on\s+low)\b/.test(lowerText)) return 'Low';
  return null;
};

function getNextWeekdayDate(weekdayName) {
  const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const targetDay = daysOfWeek.indexOf(weekdayName.toLowerCase());
  if (targetDay === -1) return null;
  const today = new Date();
  let diff = targetDay - today.getDay();
  if (diff <= 0) diff += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + diff);
  nextDate.setHours(0,0,0,0);
  return nextDate;
}

function extractTimeFromText(text) {
  const match = /(?:at|by)\s*(\d{1,2})(:(\d{2}))?\s*(am|pm)?/i.exec(text);
  if (!match) return { hours: null, minutes: null };
  let hours = parseInt(match[1], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  if (match[4]) {
    const meridian = match[4].toLowerCase();
    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
  }
  return { hours, minutes };
}

// --- Main ---
const parseTaskDetails = (taskTitle) => {
  let tempTitle = taskTitle;
  let recurrenceEndsAt = null;
  let detectedRecurrencePattern = 'none';
  let recurrenceInterval = 1;
  let recurrenceStartDate = null;
  let dueDate = null;

  // ✅ Detect recurrence & interval
  for (const entry of recurrencePatterns) {
    const matches = taskTitle.match(entry.pattern);
    if (matches) {
      detectedRecurrencePattern = entry.recurrencePattern;
      if (entry.extractInterval) {
        let intervalExtracted = 1;
        for (const phrase of matches) {
          const numMatch = phrase.match(/(\d+)/); // fresh regex
          if (numMatch) {
            const n = parseInt(numMatch[1], 10);
            if (!isNaN(n) && n > 0) {
              intervalExtracted = n;
              break;
            }
          }
        }
        recurrenceInterval = intervalExtracted;
      } else {
        recurrenceInterval = entry.interval || 1;
      }
      break;
    }
  }

  // Extract time
  const { hours: phraseHours, minutes: phraseMinutes } = extractTimeFromText(taskTitle);

  // Handle "until"
  const untilPattern = /(?:until|untill|till|til)\s+(.+)/i;
  const untilMatch = taskTitle.match(untilPattern);
  if (untilMatch && untilMatch[1]) {
    const parsed = chrono.parse(untilMatch[1]);
    if (parsed.length > 0) {
      const endDate = parsed[0].start.date();
      endDate.setHours(23,59,59,999);
      recurrenceEndsAt = endDate.toISOString();
    }
  }

  // Start date
  for (const pattern of startDatePatterns) {
    const found = taskTitle.match(pattern);
    if (found) {
      const parsed = chrono.parse(found[0]);
      if (parsed.length) {
        recurrenceStartDate = parsed[0].start.date().toISOString();
        break;
      }
    }
  }

  // Due date logic
  if (detectedRecurrencePattern === 'daily') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(phraseHours ?? 9, phraseMinutes ?? 0, 0, 0);
    dueDate = tomorrow;
  } else {
    const weekdayRegex = /\b(on|every)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\b/i;
    const weekdayMatch = taskTitle.match(weekdayRegex);
    if ((detectedRecurrencePattern === 'none' || detectedRecurrencePattern === 'weekly') && weekdayMatch && weekdayMatch[2]) {
      dueDate = getNextWeekdayDate(weekdayMatch[2]);
    }
    if (!dueDate) {
      let textForChrono = taskTitle;
      if (untilMatch) textForChrono = textForChrono.replace(untilMatch[0], '');
      const dateTimeResult = chrono.parse(textForChrono);
      if (dateTimeResult.length > 0) {
        dueDate = dateTimeResult[0].start.date();
      }
    }
    if (dueDate && phraseHours !== null) {
      dueDate.setHours(phraseHours, phraseMinutes || 0, 0, 0);
    }
  }
  if (dueDate) dueDate = dueDate.toISOString();

  // Clean task title
  tempTitle = taskTitle;
  for (const entry of recurrencePatterns) {
    const matches = tempTitle.match(entry.pattern);
    if (matches) {
      for (const phrase of matches) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        tempTitle = tempTitle.replace(new RegExp(escaped, 'gi'), '');
      }
      break;
    }
  }
  if (untilMatch) tempTitle = tempTitle.replace(untilMatch[0], '');
  for (const pattern of startDatePatterns) tempTitle = tempTitle.replace(pattern, '');
  const chronoDateTimes = chrono.parse(tempTitle);
  for (const dt of chronoDateTimes) if (dt.text) tempTitle = tempTitle.replace(dt.text, '');
  tempTitle = tempTitle.replace(timePattern, '');
  for (const exp of alwaysClean) tempTitle = tempTitle.replace(exp, '');
  if (detectedRecurrencePattern !== 'custom') tempTitle = tempTitle.replace(monthWordsPattern, '');
  tempTitle = tempTitle
    .replace(/\b(at|by|on|with|every|next|the|this|till|til|untill|until|for|beginning|start|mid|middle|end|close|daily|weekly|monthly|yearly|bi[-\s]?weekly|of|month|week|priority)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const detectedPriority = detectPriority(taskTitle);
  const finalDueDate = recurrenceStartDate || dueDate || (() => {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9,0,0,0);
    return fallback.toISOString();
  })();

  return {
    originalTitle: taskTitle,
    cleanedTitle: tempTitle || taskTitle,
    dueDate: finalDueDate,
    priority: detectedPriority,
    recurrencePattern: detectedRecurrencePattern || 'none',
    recurrenceInterval,
    recurrenceEndsAt,
  };
};

module.exports = { parseTaskDetails };
