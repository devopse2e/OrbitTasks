const chrono = require('chrono-node');

const monthNames = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];
const monthNamesShort = monthNames.map(m => m.slice(0, 3));
const monthNamesRegexPart = [...monthNamesShort, ...monthNames].join('|');

const detectPriority = (text) => {
  const lowerText = text.toLowerCase();
  const priorityPatterns = {
    High: /\b(high\s*priority|urgent|with\s+high|on\s+high)\b/,
    Medium: /\b(medium\s*priority|normal\s*priority|with\s+medium|on\s+medium)\b/,
    Low: /\b(low\s*priority|with\s+low|on\s+low)\b/
  };
  if (priorityPatterns.High.test(lowerText)) return 'High';
  if (priorityPatterns.Medium.test(lowerText)) return 'Medium';
  if (priorityPatterns.Low.test(lowerText)) return 'Low';
  return null;
};

// Recurrence patterns ordered (specific first)
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

const untilRegex = '(?:until|untill|till|til)';
const ordinalEndPatterns = [
  new RegExp(
    `\\b${untilRegex}\\s+(\\d{1,2})(st|nd|rd|th)?\\s+(?:of\\s+)?(?:the\\s+)?(next|this|current|coming|${monthNamesRegexPart})\\s+month\\b`,
    'i'
  ),
  new RegExp(
    `\\b${untilRegex}\\s+(mid(?:dle)?|end(?:ing)?)\\s+(?:of\\s+)?(?:the\\s+)?(?:next|this|current|coming|${monthNamesRegexPart})\\s+month\\b`,
    'i'
  ),
  new RegExp(`\\b${untilRegex}\\s+(next|this|current|coming|${monthNamesRegexPart})\\s+month\\b`, 'i'),
  new RegExp(`\\b${untilRegex}\\s+(mid(?:dle)?|end(?:ing)?|\\d{1,2}(st|nd|rd|th)?)\\b`, 'i'),
];

const startDatePatterns = [
  /\b(starting|beginning|from)\s+(mid(?:dle)?|end(?:ing)?|\d{1,2}(st|nd|rd|th)?|next|this|current|coming)?\s*(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\b[\w\s]*/gi,
];

const dueDateOrdinalPatterns = [
  /\bmid(?:dle)?(?:\s+of)?(?:\s+the)?\s+(next|this|current|coming)\s+month\b/i,
  /\bend(?:ing)?(?:\s+of)?(?:\s+the)?\s+(next|this|current|coming)\s+month\b/i,
  /\b(\d{1,2})(st|nd|rd|th)?\s+(?:of\s+)?(?:the\s+)?(next|this|current|coming)\s+month\b/i,
  /\bmid(?:dle)?(?:\s+of)?(?:\s+the)?\s+(next|this|current|coming)\s+week\b/i,
  /\bend(?:ing)?(?:\s+of)?(?:\s+the)?\s+(next|this|current|coming)\s+week\b/i,
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
];

const monthWordsPattern = new RegExp(`\\b(${monthNames.join('|')})\\b`, 'gi');
const timePattern = /\b((at|by|on)\s*)?(\d{1,2}(:\d{2})?\s*(am|pm))\b/gi;

// Helper: format a Date object to local date string YYYY-MM-DD
function formatDateLocalISO(date) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: get the nearest next date for given weekday name (0=Sunday...6=Saturday)
function getNextWeekdayDate(weekdayName) {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = daysOfWeek.indexOf(weekdayName.toLowerCase());
  if (targetDay === -1) return null;
  const today = new Date();
  const todayDay = today.getDay();
  let dayDifference = targetDay - todayDay;
  if (dayDifference <= 0) dayDifference += 7; // always future day
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + dayDifference);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

// Helper: extract time components (hours, minutes) from phrase like "at 6pm" or "by 7:30am"
function extractTimeFromText(text) {
  const timeMatch = /(?:at|by)\s*(\d{1,2})(:(\d{2}))?\s*(am|pm)?/i.exec(text);
  if (!timeMatch) return { hours: 0, minutes: 0 };
  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  if (timeMatch[4]) {
    const meridian = timeMatch[4].toLowerCase();
    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
  }
  return { hours, minutes };
}

const parseTaskDetails = (taskTitle) => {
  let tempTitle = taskTitle;
  let recurrenceEndsAt = null;
  let detectedRecurrencePattern = 'none';
  let recurrenceInterval = 1;
  let recurrenceStartDate = null;

  // 1. Detect recurrence pattern from original text first (no removing text yet)
  for (const entry of recurrencePatterns) {
    const matches = taskTitle.match(entry.pattern);
    if (matches) {
      detectedRecurrencePattern = entry.recurrencePattern;
      if (entry.extractInterval) {
        let intervalExtracted = 1;
        for (const phrase of matches) {
          const intervalMatch = entry.pattern.exec(phrase);
          if (intervalMatch && intervalMatch[1]) {
            const n = parseInt(intervalMatch[1], 10);
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

  // 2. Detect weekday (e.g., "on Mondays", "every Monday")
  let detectedWeekday = null;
  const weekdayRegex = /\b(on|every)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\b/i;
  const weekdayMatch = taskTitle.match(weekdayRegex);
  if (weekdayMatch && weekdayMatch[2]) {
    detectedWeekday = weekdayMatch[2];
  }

  // 3. Parse time from phrase if any (used later)
  const { hours: phraseHours, minutes: phraseMinutes } = extractTimeFromText(taskTitle);

  // 4. Determine dueDate for weekly recurrence with weekday, applying time if present
  let dueDate = null;
  if ((detectedRecurrencePattern === 'none' || detectedRecurrencePattern === 'weekly') && detectedWeekday) {
    const nextWeekdayDate = getNextWeekdayDate(detectedWeekday);
    if (nextWeekdayDate) {
      // Apply parsed time if any, else default 0:00
      nextWeekdayDate.setHours(phraseHours);
      nextWeekdayDate.setMinutes(phraseMinutes);
      nextWeekdayDate.setSeconds(0);
      nextWeekdayDate.setMilliseconds(0);
      dueDate = nextWeekdayDate.toISOString();
    }
  }

  // 5. Calculate dueDate for monthly recurrence with 'on the Xth', applying time if present
  if (detectedRecurrencePattern === 'monthly') {
    const dayOfMonthMatch = /(?:on\s+)?the\s+(\d{1,2})(st|nd|rd|th)?/i.exec(taskTitle);
    if (dayOfMonthMatch) {
      const dayOfMonth = parseInt(dayOfMonthMatch[1], 10);
      if (dayOfMonth >= 1 && dayOfMonth <= 31) {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();
        if (today.getDate() >= dayOfMonth) {
          month += 1;
          if (month > 11) {
            month = 0;
            year += 1;
          }
        }
        let due = new Date(year, month, dayOfMonth, phraseHours, phraseMinutes, 0, 0);
        // Handle invalid date (e.g. Feb 30)
        while (due.getDate() !== dayOfMonth) {
          month++;
          if (month > 11) {
            month = 0;
            year++;
          }
          due = new Date(year, month, dayOfMonth, phraseHours, phraseMinutes, 0, 0);
        }
        dueDate = due.toISOString();
      }
    }
  }

  // 6. Recurrence END detection ("until ...")
  for (const pattern of ordinalEndPatterns) {
    const found = taskTitle.match(pattern);
    if (found) {
      let phraseToParse = found[0].replace(/^(?:until|untill|till|til)\s+/i, '');

      const ordinalNextMonthMatch = /(\d{1,2})(st|nd|rd|th)? of ((next|this|current|coming)\s+month|[a-zA-Z]+)/i.exec(phraseToParse);
      if (ordinalNextMonthMatch) {
        const day = parseInt(ordinalNextMonthMatch[1], 10);
        const monthWord = ordinalNextMonthMatch[3].toLowerCase();
        const now = new Date();
        let monthIndex;

        if (/next|this|current|coming/.test(monthWord)) {
          monthIndex = now.getMonth() + 1;
        } else {
          let mn = monthNames.findIndex(m => m.startsWith(monthWord.slice(0, 3)));
          monthIndex = mn !== -1 ? mn : now.getMonth() + 1;
        }
        let year = now.getFullYear();
        if (monthIndex <= now.getMonth()) year++;

        const recurEnd = new Date(year, monthIndex, day);
        recurrenceEndsAt = recurEnd.toISOString();
        break;
      }

      if (/\bnext month\b/i.test(phraseToParse)) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const recurEnd = new Date(year, month, day);
        recurrenceEndsAt = recurEnd.toISOString();
        break;
      }

      const parsed = chrono.parse(phraseToParse);
      if (parsed.length > 0) {
        recurrenceEndsAt = parsed[0].start.date().toISOString();
        break;
      }
    }
  }

  // 7. Recurrence START detection
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

  // 8. Fallback: if no dueDate yet, parse from chrono directly
  if (!dueDate) {
    const dateTimeResult = chrono.parse(taskTitle);
    if (dateTimeResult.length > 0) {
      let isInUntilPhrase = false;
      for (const pattern of ordinalEndPatterns) {
        if (pattern.test(taskTitle)) {
          isInUntilPhrase = true;
          break;
        }
      }
      if (!isInUntilPhrase) {
        dueDate = dateTimeResult[0].start.date().toISOString();
      }
    }
  }

  // Begin cleaning the tempTitle string by removing matched phrases

  tempTitle = taskTitle; // reset

  // Remove recurrence phrases
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

  // Remove ordinal end phrases (until ...)
  for (const pattern of ordinalEndPatterns) {
    tempTitle = tempTitle.replace(pattern, '');
  }

  // Remove startDate phrases
  for (const pattern of startDatePatterns) {
    tempTitle = tempTitle.replace(pattern, '');
  }

  // Remove date/time phrases recognized by chrono
  const chronoDateTimes = chrono.parse(tempTitle);
  for (const dt of chronoDateTimes) {
    if (dt.text) tempTitle = tempTitle.replace(dt.text, '');
  }

  // Remove priority words
  tempTitle = tempTitle.replace(/\b(high\s*priority|urgent|with\s+high|on\s+high|medium\s*priority|normal\s*priority|with\s+medium|on\s+medium|low\s*priority|with\s+low|on\s+low)\b/gi, '');

  // Remove time expressions like "at 7am"
  tempTitle = tempTitle.replace(timePattern, '');

  // Remove alwaysCleaning phrases
  for (const exp of alwaysClean) {
    tempTitle = tempTitle.replace(exp, '');
  }

  // Remove month names except for custom recurrence
  if (detectedRecurrencePattern !== 'custom') {
    tempTitle = tempTitle.replace(monthWordsPattern, '');
  }

  // Remove common connectors and trim
  tempTitle = tempTitle
    .replace(/\b(at|by|on|with|every|next|the|this|till|til|untill|until|for|beginning|start|mid|middle|end|close|daily|weekly|monthly|yearly|bi[-\s]?weekly|of|month|week|priority)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const cleanedTitle = tempTitle || taskTitle;

  // Priority detection from original title to ensure consistency
  const detectedPriority = detectPriority(taskTitle);

  // Finalize dueDate prioritizing recurrenceStartDate > dueDate > now
  const finalDueDate = recurrenceStartDate || dueDate || new Date().toISOString();

  return {
    originalTitle: taskTitle,
    cleanedTitle,
    dueDate: finalDueDate,
    priority: detectedPriority,
    recurrencePattern: detectedRecurrencePattern || 'none',
    recurrenceInterval,
    recurrenceEndsAt,
  };
};

module.exports = { parseTaskDetails };
