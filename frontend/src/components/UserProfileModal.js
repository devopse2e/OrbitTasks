import React, { useState } from 'react';
import '../styles/UserProfileModal.css';

// Utility for YYYY-MM-DD formatting
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d)) return "";
  return d.toISOString().substring(0, 10);
};

const SimpleProfileModal = ({ user, open, onClose, onSave }) => {
  // Local state with formatted date
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [dob, setDob] = useState(formatDateForInput(user.dob));
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ displayName, dob });
    setSaving(false);
    onClose();
  };

  return (
    <div className="simple-modal-overlay">
      <form
        className="simple-profile-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <button
          className="modal-close-btn"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="simple-modal-title">Edit Profile</h2>
        <label>
          Display Name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            required
            autoFocus
            className="profile-input"
            autoComplete="new-display-name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={user.email}
            readOnly
            className="profile-input readonly"
            autoComplete="off"
            tabIndex={-1}
            aria-readonly="true"
          />
        </label>
        <label>
          Date of Birth
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="profile-input"
            autoComplete="bday"
          />
        </label>
        <div className="simple-modal-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimpleProfileModal;
