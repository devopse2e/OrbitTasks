import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import '../styles/Auth.css'; // Your main auth styles

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const { login, loginAsGuest, forgotPasswordDirect, error: authError, loading, isAuthenticated, clearError } = useContext(AuthContext); // NEW: Assume clearError from context
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  // NEW: Clear errors on component mount (when page loads)
  useEffect(() => {
    if (clearError) clearError(); // Clear context errors
    setLocalError('');            // Clear local errors
    setForgotError('');           // Clear forgot errors
    setForgotMessage('');         // Clear forgot messages
  }, []); // Empty dependency array: runs once on mount

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in all fields.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch {
      // error shown from context
    }
  };

  const handleSkipLogin = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  // ---- Forgot Password Logic ----
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    if (!forgotEmail.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setForgotError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setForgotError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    try {
      // Use context if connected, else fallback to fetch
      let data;
      if (forgotPasswordDirect) {
        data = await forgotPasswordDirect(forgotEmail, newPassword, confirmPassword);
      } else {
        const res = await fetch('/api/auth/forgot-password-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, newPassword, confirmPassword }),
        });
        data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Something went wrong.');
        }
      }
      setForgotMessage(data.message || 'Password updated successfully! You can now log in.');
      setForgotEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowForgot(false), 1800);
    } catch (err) {
      setForgotError(err.message || 'Network error. Try again.');
    }
    setForgotLoading(false);
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotError('');
    setForgotMessage('');
    setForgotEmail('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // allow ESC or clicking backdrop to close the modal
  useEffect(() => {
    if (!showForgot) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeForgot();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForgot]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Sign In</h2>

        {/* Display local validation error */}
        {localError && <ErrorMessage message={localError} />}

        {/* Display auth error from context (e.g., invalid credentials) */}
        {authError && <ErrorMessage message={authError} />}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button className="auth-button" type="button" onClick={handleSkipLogin}>
            Skip Login (Guest Mode)
          </button>
        </form>

        <div className="auth-redirect">
          <button className="forgot-link" type="button" onClick={() => setShowForgot(true)}>
            Forgot password?
          </button>
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>

        {showForgot && (
          <div className="modal-backdrop" onClick={closeForgot}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Reset Password</h3>

              {/* Display forgot errors and messages */}
              {forgotError && <ErrorMessage message={forgotError} />}
              {forgotMessage && <div className="success-message">{forgotMessage}</div>}

              <div className="input-group-fp">
                <label htmlFor="forgotEmail">Email</label>
                <input
                  type="email"
                  id="forgotEmail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Your Email"
                  required
                />
              </div>
              <div className="input-group-fp">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  required
                />
              </div>
              <div className="input-group-fp">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  required
                />
              </div>
              <div className="modal-actions">
                <button className="auth-button" onClick={handleForgotSubmit} disabled={forgotLoading}>
                  {forgotLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button className="cancel-btn" type="button" onClick={closeForgot}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
