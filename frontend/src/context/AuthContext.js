import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authService, userService } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user state from localStorage, guarding against undefined or corrupted entries
  const [user, setUserState] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Wrapped setUser to persist changes to localStorage safely
  const setUser = useCallback((newUser) => {
    if (newUser && typeof newUser === 'object') {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      if (newUser === null || newUser === false) {
        localStorage.removeItem('user');
      } else {
        console.warn('Attempted to set invalid user to localStorage:', newUser);
      }
    }
    setUserState(newUser);
  }, []);

  // On app mount, refresh user profile from backend if token exists
  useEffect(() => {
    async function refreshUserProfile() {
      if (user && user.token) {
        try {
          const profile = await userService.getProfile();
          const updatedUser = {
            ...user,
            ...profile,
            token: user.token,
          };
          setUser(updatedUser);
        } catch (fetchError) {
          console.error('Failed to fetch user profile on startup:', fetchError);
          // Optionally logout user if token expired or invalid
          // setUser(null);
        }
      }
    }
    refreshUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // ----- AUTH FUNCTIONS -----
  const register = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const newUser = await authService.register({ email, password });
        setUser(newUser);
      } catch (err) {
        setError(err.message || 'Registration failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const loggedInUser = await authService.login({ email, password });
        const profile = await userService.getProfile(loggedInUser.token);

        const mergedUser = {
          ...loggedInUser,
          ...profile, // ensures we have name, dob, etc.
          token: loggedInUser.token,
        };
  
        setUser(mergedUser);
      } catch (err) {
        setError(err.message || 'Login failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  // FORGOT PASSWORD DIRECT (added earlier)
  const forgotPasswordDirect = useCallback(
    async (email, newPassword, confirmPassword) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authService.forgotPasswordDirect({
          email,
          newPassword,
          confirmPassword,
        });
        return res; // backend returns { message }
      } catch (err) {
        setError(err.message || 'Password reset failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Login as guest
  const loginAsGuest = useCallback(() => {
    const guestUser = {
      _id: 'guest',
      email: 'Guest User',
      isGuest: true,
    };
    setUser(guestUser);
  }, [setUser]);

  // ----- LOGOUT LOGIC W/ THEME FIX -----
  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem('guestTodos');
    setUser(null);

    // ---- THEME RESET AFTER LOGOUT ----
    // Remove all theme classes and set dark theme
    if (document && document.body) {
      document.body.classList.remove('light');
      
      // If you use data-theme, uncomment:
      // document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        loginAsGuest,
        forgotPasswordDirect,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
