import React, { useState } from 'react';
import '../styles/UserProfileModal.css'; // reuse same modal styles

const UpdatePasswordModal = ({ open, onClose, onSave }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Match backend's Joi validation: min 8 chars
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      // Send both password and confirmPassword to backend
      await onSave({
        password: newPassword,
        confirmPassword: confirmPassword,
      });
      setSaving(false);
      // Optionally clear the form before closing
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update password');
      setSaving(false);
    }
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

        <h2 className="simple-modal-title">Update Password</h2>

        <label>
          New Password
          <input
            type="password"
            value={newPassword}
            maxLength={64}
            minLength={8}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            maxLength={64}
            minLength={8}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <div style={{ color: '#e86c6c', marginBottom: '1rem', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <div className="simple-modal-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
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

export default UpdatePasswordModal;
