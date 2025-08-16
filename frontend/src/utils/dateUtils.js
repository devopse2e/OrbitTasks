// frontend/src/utils/dateUtils.js

import {
    format,
    isPast,
    isToday,
    isTomorrow,
    isYesterday,
    differenceInMinutes,
    isBefore,
    isAfter,
    startOfDay,
    endOfDay,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    isEqual,
    parseISO
  } from 'date-fns';
  import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
  
  // New helper: Get a user-friendly label for a timezone with current offset
  export const getTimezoneLabel = (timeZone) => {
    try {
      const now = new Date();
      const offset = formatInTimeZone(now, timeZone, 'xxx'); // e.g., '+0530'
      return `${timeZone} (UTC${offset})`;
    } catch {
      return timeZone; // Fallback if invalid
    }
  };
  
  // Helper to convert a UTC/ISO string date to a zoned date in the provided timezone
  const getZonedDate = (dateString, timeZone) => {
    if (!dateString || !timeZone) return null;
    try {
      // Parse the date as UTC (assuming backend sends ISO strings in UTC)
      const utcDate = parseISO(dateString);
      if (isNaN(utcDate.getTime())) return null;
      // Convert to the provided timezone
      return toZonedTime(utcDate, timeZone);
    } catch {
      return null; // Invalid date or timezone
    }
  };
  
  // Formats the creation date (e.g., "Today", "Yesterday", "MMM d, yyyy")
  export const formatCreatedAt = (dateString, timeZone) => {
    const zonedDate = getZonedDate(dateString, timeZone);
    if (!zonedDate) return '';
  
    const nowZoned = toZonedTime(new Date(), timeZone);
  
    if (isYesterday(zonedDate, nowZoned)) return 'Yesterday';
    if (isToday(zonedDate, nowZoned)) return 'Today';
    // For other dates, format as "Aug 28, 2025" in provided timezone
    return formatInTimeZone(zonedDate, timeZone, 'MMM d, yyyy');
  };
  
  /**
   * Formats the due date with specific text and color rules,
   * ensuring all comparisons and displays are based on the provided timezone.
   */
  export const formatDueDate = (dateString, timeZone) => {
    const zonedDate = getZonedDate(dateString, timeZone);
    if (!zonedDate) return { text: 'No due date', color: 'gray' };
  
    const nowZoned = toZonedTime(new Date(), timeZone); // Current time in provided timezone
  
    const zonedStartOfToday = startOfDay(nowZoned);
    const zonedEndOfToday = endOfDay(nowZoned);
  
    // --- 1. PAST DATES ---
    // Check if the zoned date is before the start of the current zoned day
    if (isBefore(zonedDate, zonedStartOfToday)) {
      // If it was yesterday
      if (isYesterday(zonedDate, nowZoned)) return { text: 'Yesterday', color: 'red' };
      // If it was before yesterday, just show the date
      return { text: formatInTimeZone(zonedDate, timeZone, 'MMM d'), color: 'red' };
    }
  
    // --- 2. DATES FOR TODAY ---
    // Check if the zoned date is within the current zoned day (start to end)
    if (isAfter(zonedDate, zonedStartOfToday) && isBefore(zonedDate, zonedEndOfToday)) {
      // If it's already passed in the current day
      if (isPast(zonedDate)) {
        const minutesAgo = differenceInMinutes(nowZoned, zonedDate);
        if (minutesAgo < 60) {
          return { text: `Overdue ${minutesAgo}min`, color: 'red' };
        } else {
          const hoursAgo = Math.round(minutesAgo / 60);
          return { text: `Overdue ${hoursAgo}hr`, color: 'red' };
        }
      }
      // If it's still in the future today
      return { text: `Today at ${formatInTimeZone(zonedDate, timeZone, 'h:mm a')}`, color: 'orange' };
    }
  
    // --- 3. DATES FOR TOMORROW ---
    // Check if the zoned date is within tomorrow's zoned day
    if (isTomorrow(zonedDate, nowZoned)) {
      return { text: `Tomorrow at ${formatInTimeZone(zonedDate, timeZone, 'h:mm a')}`, color: 'black' };
    }
  
    // --- 4. FUTURE DATES (after tomorrow) ---
    // If it's more than a day away
    return { text: formatInTimeZone(zonedDate, timeZone, 'MMM d, yyyy h:mm a'), color: 'black' };
  };
  
  // Generate occurrences of a recurring todo within given visible date range
  export function generateRecurringInstances(todo, rangeStart, rangeEnd, timeZone) {
    console.log('[generateRecurringInstances] Incoming task:', {
      text: todo.text,
      dueDate: todo.dueDate,
      recurrencePattern: todo.recurrencePattern,
      recurrenceInterval: todo.recurrenceInterval,
      recurrenceEndsAt: todo.recurrenceEndsAt,
      isRecurring: todo.isRecurring,
      timeZone
    });
  
    if (!todo.isRecurring || !todo.dueDate || !timeZone) return [todo]; // Not recurring, no initial due date, or no timezone
  
    const instances = [];
    const interval = todo.recurrenceInterval || 1;
  
    // Zone all input dates to the provided timezone
    let nextOccurrence = getZonedDate(todo.dueDate, timeZone);
    const zonedRangeStart = getZonedDate(rangeStart?.toISOString(), timeZone) || new Date();
    const zonedRangeEnd = getZonedDate(rangeEnd?.toISOString(), timeZone) || addYears(new Date(), 1); // Default to 1 year ahead if not provided
    const zonedEndsAt = todo.recurrenceEndsAt ? getZonedDate(todo.recurrenceEndsAt, timeZone) : null;
  
    // If recurrence pattern 'none' or unknown, just return original if in range
    if (!todo.recurrencePattern || todo.recurrencePattern === 'none') {
      if ((isAfter(nextOccurrence, zonedRangeStart) || isEqual(nextOccurrence, zonedRangeStart)) &&
          (isBefore(nextOccurrence, zonedRangeEnd) || isEqual(nextOccurrence, zonedRangeEnd))) {
        instances.push(todo);
      }
      return instances;
    }
  
    // Function to add recurrence interval to a zoned date (convert to UTC for addition, then back to zoned)
    const addInterval = (date, pattern, intervalCount) => {
      const utcDate = fromZonedTime(date, timeZone); // To UTC for safe addition
      let newUtcDate;
      switch (pattern) {
        case 'daily':
          newUtcDate = addDays(utcDate, intervalCount);
          break;
        case 'weekly':
          newUtcDate = addWeeks(utcDate, intervalCount);
          break;
        case 'monthly':
          newUtcDate = addMonths(utcDate, intervalCount);
          break;
        case 'yearly':
          newUtcDate = addYears(utcDate, intervalCount);
          break;
        default:
          return null; // For 'custom' no auto generation here
      }
      return toZonedTime(newUtcDate, timeZone); // Back to zoned
    };
  
    while (nextOccurrence &&
        (isBefore(nextOccurrence, zonedRangeEnd) || isEqual(nextOccurrence, zonedRangeEnd))) {
  
      if (isAfter(nextOccurrence, zonedRangeStart) || isEqual(nextOccurrence, zonedRangeStart)) {
        // Create an occurrence clone, overwrite dueDate to instance date (as UTC ISO)
        const instanceDueUtc = fromZonedTime(nextOccurrence, timeZone).toISOString();
        const instance = { ...todo, dueDate: instanceDueUtc };
        instances.push(instance);
      }
  
      const candidate = addInterval(nextOccurrence, todo.recurrencePattern, interval);
      if (!candidate) break;
  
      // Stop if beyond defined recurrence end date
      if (zonedEndsAt && isAfter(candidate, zonedEndsAt)) break;
      nextOccurrence = candidate;
    }
  
    return instances;
  }
  