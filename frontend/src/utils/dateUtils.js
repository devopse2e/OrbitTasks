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
  isEqual
} from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

// Get the user's local timezone
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Helper to convert a UTC/ISO string date to a zoned date in the user's timezone
const getZonedDate = (dateString) => {
  if (!dateString) return null;
  // Parse the date as UTC first (assuming backend sends ISO strings or UTC dates)
  const utcDate = new Date(dateString);
  // Convert to the user's resolved timezone
  return toZonedTime(utcDate, userTimeZone);
};

// Formats the creation date (e.g., "Today", "Yesterday", "MMM d, yyyy")
export const formatCreatedAt = (dateString) => {
  const zonedDate = getZonedDate(dateString);
  if (!zonedDate) return '';

  if (isYesterday(zonedDate)) return 'Yesterday';
  if (isToday(zonedDate)) return 'Today';
  // For other dates, format as "Aug 28, 2025" in user's timezone
  return formatInTimeZone(zonedDate, userTimeZone, 'MMM d, yyyy');
};

/**
* Formats the due date with specific text and color rules,
* ensuring all comparisons and displays are based on the user's local timezone.
*/
export const formatDueDate = (dateString) => {
  const zonedDate = getZonedDate(dateString);
  if (!zonedDate) return { text: 'No due date', color: 'gray' };

  const nowZoned = toZonedTime(new Date(), userTimeZone); // Current time in user's timezone

  // --- 1. PAST DATES ---
  // Check if the zoned date is before the start of the current zoned day
  if (isBefore(zonedDate, startOfDay(nowZoned))) {
      // If it was yesterday
      if (isYesterday(zonedDate)) return { text: 'Yesterday', color: 'red' };
      // If it was before yesterday, just show the date
      return { text: formatInTimeZone(zonedDate, userTimeZone, 'MMM d'), color: 'red' };
  }

  // --- 2. DATES FOR TODAY ---
  // Check if the zoned date is within the current zoned day (start to end)
  if (isAfter(zonedDate, startOfDay(nowZoned)) && isBefore(zonedDate, endOfDay(nowZoned))) {
      // If it's already passed in the current day
      if (isPast(zonedDate, nowZoned)) {
          const minutesAgo = differenceInMinutes(nowZoned, zonedDate);
          if (minutesAgo < 60) {
              return { text: `Overdue ${minutesAgo}min`, color: 'red' };
          } else {
              const hoursAgo = Math.round(minutesAgo / 60);
              return { text: `Overdue ${hoursAgo}hr`, color: 'red' };
          }
      }
      // If it's still in the future today
      return { text: `Today at ${formatInTimeZone(zonedDate, userTimeZone, 'h:mm a')}`, color: 'orange' };
  }

  // --- 3. DATES FOR TOMORROW ---
  // Check if the zoned date is within tomorrow's zoned day
  if (isTomorrow(zonedDate)) {
      return { text: `Tomorrow at ${formatInTimeZone(zonedDate, userTimeZone, 'h:mm a')}`, color: 'black' };
  }

  // --- 4. FUTURE DATES (after tomorrow) ---
  // If it's more than a day away
  return { text: formatInTimeZone(zonedDate, userTimeZone, 'MMM d, yyyy h:mm a'), color: 'black' };
};

// Generate occurrences of a recurring todo within given visible date range
export function generateRecurringInstances(todo, rangeStart, rangeEnd) {
    console.log('[generateRecurringInstances] Incoming task:', {
  text: todo.text,
  dueDate: todo.dueDate,
  recurrencePattern: todo.recurrencePattern,
  recurrenceInterval: todo.recurrenceInterval,
  recurrenceEndsAt: todo.recurrenceEndsAt,
  isRecurring: todo.isRecurring
});
  if (!todo.isRecurring || !todo.dueDate) return [todo]; // Not recurring or no initial due date

  const instances = [];
  const interval = todo.recurrenceInterval || 1;
  let nextOccurrence = new Date(todo.dueDate);

  // If recurrence pattern 'none' or unknown, just return original if in range
  if (!todo.recurrencePattern || todo.recurrencePattern === 'none') {
      if ((isAfter(nextOccurrence, rangeStart) || isEqual(nextOccurrence, rangeStart)) &&
          (isBefore(nextOccurrence, rangeEnd) || isEqual(nextOccurrence, rangeEnd))) {
          instances.push(todo);
      }
      return instances;
  }

  // Function to add recurrence interval to date
  const addInterval = (date, pattern, intervalCount) => {
      switch (pattern) {
          case 'daily':
              return addDays(date, intervalCount);
          case 'weekly':
              return addWeeks(date, intervalCount);
          case 'monthly':
              return addMonths(date, intervalCount);
          case 'yearly':
              return addYears(date, intervalCount);
          default:
              return null; // For 'custom' no auto generation here
      }
  };

  while (nextOccurrence &&
      (isBefore(nextOccurrence, rangeEnd) || isEqual(nextOccurrence, rangeEnd))) {

      if (nextOccurrence >= rangeStart) {
          // Create an occurrence clone, overwrite dueDate to instance date
          const instance = { ...todo, dueDate: nextOccurrence.toISOString() };
          instances.push(instance);
      }

      const candidate = addInterval(nextOccurrence, todo.recurrencePattern, interval);
      if (!candidate) break;

      // Stop if beyond defined recurrence end date
      if (todo.recurrenceEndsAt && isAfter(candidate, new Date(todo.recurrenceEndsAt))) break;
      nextOccurrence = candidate;
  }

  return instances;
}
