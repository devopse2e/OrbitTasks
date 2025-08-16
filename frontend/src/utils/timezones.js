// src/utils/timezones.js

// A curated list of common IANA timezones for the dropdown.
// This provides a good user experience without overwhelming them.
// For labels with offsets, use getTimezoneLabel from dateUtils.js.
export const commonTimezones = [
    'UTC',
    'GMT',
    'US/Pacific',   // PST/PDT
    'US/Mountain',  // MST/MDT
    'US/Central',   // CST/CDT
    'US/Eastern',   // EST/EDT
    'Europe/London',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];
  
  // Optional: Function to get all IANA timezones (if needed for expansion)
  // export const getAllTimezones = () => Intl.supportedValuesOf('timeZone');
  