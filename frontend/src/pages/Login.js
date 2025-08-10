import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css'; // Your main auth styles
 // <-- Add this, or merge to Auth.css

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

    const { login, loginAsGuest, forgotPasswordDirect, error: authError, loading, isAuthenticated } = useContext(AuthContext);
    const [localError, setLocalError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
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
        navigate('/');
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
                    body: JSON.stringify({
                        email: forgotEmail,
                        newPassword,
                        confirmPassword,
                    }),
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
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Please log in to continue</p>
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {(localError || authError) && (
                        <p className="error-message">
                            {localError || (authError && authError.message) || 'Login failed'}
                        </p>
                    )}
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
                {/* "Forgot password?" link */}
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <button
                        type="button"
                        className="forgot-link"
                        onClick={() => setShowForgot(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#7c47fd',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: 0,
                        }}
                    >
                        Forgot password?
                    </button>
                </div>

                {/* DARK THEME MODAL */}
                {showForgot && (
                    <div
                        className="modal-backdrop"
                        onClick={e => {
                            if (e.target.className === 'modal-backdrop') closeForgot();
                        }}
                    >
                        <div className="modal" role="dialog" aria-modal="true">
                            <form className="forgot-form" onSubmit={handleForgotSubmit}>
                                <h3>Reset Password</h3>
                                <div className="input-group">
                                    <label htmlFor="forgot-email">Email Address</label>
                                    <input
                                        type="email"
                                        id="forgot-email"
                                        value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="new-password">New Password</label>
                                    <input
                                        type="password"
                                        id="new-password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="confirm-password">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirm-password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                {forgotError && <p className="error-message">{forgotError}</p>}
                                {forgotMessage && <p className="success-message">{forgotMessage}</p>}
                                <div className="modal-actions">
                                    <button type="submit" className="auth-button" disabled={forgotLoading}>
                                        {forgotLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={closeForgot}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="auth-separator">
                    <span>or</span>
                </div>
                <button onClick={handleSkipLogin} className="skip-button">
                    Try as Guest
                </button>
                <p className="auth-redirect">
                    Don't have an account? <Link to="/register">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
