// src/components/TimezoneModal.js

import React, { useState, useContext } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { commonTimezones } from '../utils/timezones';
import { getTimezoneLabel } from '../utils/dateUtils'; // New helper for offsets
import '../styles/TimezoneModal.css';

const TimezoneModal = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuthContext();
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || localStorage.getItem('userTimeZone') || 'UTC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation: Ensure it's a valid IANA timezone
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: selectedTimezone }); // Throws if invalid
    } catch {
      setError('Invalid timezone selected.');
      setLoading(false);
      return;
    }

    try {
      // Save to backend
      await updateUserProfile({ timezone: selectedTimezone });
      // Fallback to localStorage
      localStorage.setItem('userTimeZone', selectedTimezone);
      setSuccess('Timezone updated successfully!');
      // Dispatch event for app-wide refresh (e.g., re-format dates)
      window.dispatchEvent(new Event('timezoneChanged'));
      setTimeout(() => {
        onClose();
        setSuccess(''); // Reset for next time
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update timezone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h2>Select Timezone</h2>
        <p>This affects how due dates and times are displayed in the app.</p>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="timezone-select">Timezone</label>
            <select
              id="timezone-select"
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              aria-describedby="timezone-help"
            >
              {commonTimezones.map((tz) => (
                <option key={tz} value={tz}>
                  {getTimezoneLabel(tz)} {/* Now includes offset */}
                </option>
              ))}
            </select>
            <small id="timezone-help" className="form-text">Select your preferred timezone.</small>
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button type="submit" className="modal-save-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TimezoneModal;
