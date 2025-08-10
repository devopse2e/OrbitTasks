import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// FIX: Import the AuthContext to use it
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // FIX: Use state and functions from AuthContext
    const { register, error: authError, loading, isAuthenticated } = useContext(AuthContext);
    const [localError, setLocalError] = useState('');

    const navigate = useNavigate();
    
    // Redirect if user is already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }

        try {
            // FIX: Call the actual register function from the context
            await register(email, password);
             // Navigation will be handled by the effect above
        } catch (err) {
            // The context will handle setting the authError
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Create an Account</h2>
                <p className="auth-subtitle">Get started with your new to-do list</p>
                <form onSubmit={handleSubmit} className="auth-form">
                    {/* FIX: Display errors from either local validation or the auth context */}
                    {(localError || authError) && <p className="error-message">{localError || authError.message}</p>}
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
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
                            placeholder="•••••••• (min. 8 characters)"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Registering...' : 'Sign Up'}
                    </button>
                </form>
                <p className="auth-redirect">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
