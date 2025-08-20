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
      // Also sync timezone to localStorage for quick access
      if (newUser.timezone) {
        localStorage.setItem('userTimeZone', newUser.timezone);
      }
    } else {
      if (newUser === null || newUser === false) {
        localStorage.removeItem('user');
        localStorage.removeItem('userTimeZone');
      } else {
        console.warn('Attempted to set invalid user to localStorage:', newUser);
      }
    }
    setUserState(newUser);
  }, []);

  // NEW: Function to clear error state
  const clearError = useCallback(() => {
    setError(null);
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
          // Sync timezone to localStorage
          if (profile.timezone) {
            localStorage.setItem('userTimeZone', profile.timezone);
          }
        } catch (fetchError) {
          console.error('Failed to fetch user profile on startup:', fetchError);
          // Fallback to localStorage timezone if available
          const fallbackTz = localStorage.getItem('userTimeZone') || 'UTC';
          setUser({ ...user, timezone: fallbackTz });
        }
      }
    }
    refreshUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // ----- Function to handle all profile updates -----
  const updateUserProfile = useCallback(
    async (profileData) => {
      try {
        // Validate timezone if provided
        if (profileData.timezone) {
          new Intl.DateTimeFormat('en-US', { timeZone: profileData.timezone }); // Throws if invalid
        }
        const updatedUserWithToken = await userService.updateProfile(profileData);
        // Merge with existing user to ensure we don't lose any fields, then update
        const mergedUser = { ...user, ...updatedUserWithToken };
        setUser(mergedUser);
        // Sync timezone to localStorage
        if (updatedUserWithToken.timezone) {
          localStorage.setItem('userTimeZone', updatedUserWithToken.timezone);
        }
        // Dispatch event for app-wide refresh
        window.dispatchEvent(new Event('timezoneChanged'));
      } catch (err) {
        console.error('Failed to update profile:', err);
        throw err; // Re-throw the error to be handled by the UI component
      }
    },
    [user, setUser]
  );

  // ----- AUTH FUNCTIONS -----
  const register = useCallback(
    async (email, password, confirmPassword) => {
      setLoading(true);
      setError(null);
      try {
        const newUser = await authService.register({ email, password, confirmPassword });
        console.log('REGISTER API returned:', newUser);
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
    const fallbackTz = localStorage.getItem('userTimeZone') || 'UTC';
    const guestUser = {
      _id: 'guest',
      email: 'Guest User',
      isGuest: true,
      timezone: fallbackTz, // Initialize with stored or default timezone
    };
    setUser(guestUser);
  }, [setUser]);

  // ----- LOGOUT LOGIC W/ THEME FIX -----
  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem('guestTodos');
    localStorage.removeItem('userTimeZone'); // Clear timezone on logout
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
        updateUserProfile,
        clearError, // NEW: Expose clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
