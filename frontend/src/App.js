import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  BrowserRouter as Router, Routes, Route, Navigate, useNavigate
} from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { TodosProvider, useTodosContext } from './context/TodosContext';
import TodoList from './components/TodoList';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfileModal from './components/UserProfileModal';
import CompletedTasksPanel from './components/CompletedTasksPanel';
import UpdatePasswordModal from './components/UpdatePasswordModal';
import TimezoneModal from './components/TimezoneModal'; 
import { userService } from './services/api';
import SideBannerLeft from './components/SideBanner'; s
import './styles/App.css';
import './styles/SideBanner.css';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
};

const ThemeToggle = ({ theme, setTheme }) => {
  const isLight = theme === 'light';
  const toggle = () => setTheme(isLight ? 'dark' : 'light');
  return (
    <div
      className="theme-toggle-container"
      role="switch"
      aria-checked={isLight}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      aria-label="Toggle light and dark theme"
    >
      <span
        className={`theme-label light-label ${isLight ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); if (!isLight) setTheme('light'); }}
        role="button"
        tabIndex={0}
        aria-pressed={isLight}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isLight) setTheme('light');
          }
        }}
      >Light</span>
      <div className="toggle-switch" aria-hidden="true">
        <div className={`toggle-knob ${isLight ? 'light' : 'dark'}`} />
      </div>
      <span
        className={`theme-label dark-label ${!isLight ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); if (isLight) setTheme('dark'); }}
        role="button"
        tabIndex={0}
        aria-pressed={!isLight}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isLight) setTheme('dark');
          }
        }}
      >Dark</span>
    </div>
  );
};

// --- Interactive Brand logo: uses theme for all colors ---
const BrandLogo = ({ theme }) => {
  const [rotation, setRotation] = useState(0);
  const [isHovered, setHovered] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const lastX = useRef(0);
  const requestRef = useRef();

  const AUTO_ROTATE_SPEED = 0.45;

  const animate = () => {
    if (!isHovered && !isDragging) {
      setRotation(prev => (prev + AUTO_ROTATE_SPEED) % 360);
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isHovered, isDragging]);

  const onPointerDown = (e) => {
    setDragging(true);
    lastX.current = e.clientX;
    e.target.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - lastX.current;
      const sensitivity = 0.5;
      setRotation((prev) => (prev + dx * sensitivity + 360) % 360);
      lastX.current = e.clientX;
    }
  };
  const onPointerUp = (e) => {
    setDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  // Orbit dot position calculation
  const R = 15;
  const center = 23;
  const angleRad = (rotation - 90) * (Math.PI / 180);
  const dotX = center + R * Math.cos(angleRad);
  const dotY = center + R * Math.sin(angleRad);

  // Theme-aware color choices
  const isDark = theme === 'dark';
  const bright = "#fff";
  const purple = "#7c3aed";
  const dotColor = isDark ? bright : purple;
  const strokeColor = isDark ? bright : purple;
  const checkColor = isDark ? bright : purple;
  const textColor = isDark ? bright : purple;

  return (
    <span
      className="app-brand-logo"
      onClick={() => window.location.reload()}
      aria-label="OrbitTasks"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        gap: '12px',
      }}
      title="Click to refresh"   
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 46 46"
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
      >
        <circle
          cx="23"
          cy="23"
          r={R}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.3"
        />
        <circle
          cx={dotX}
          cy={dotY}
          r="3"
          fill={dotColor}
          style={{ cursor: 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => { setHovered(false); setDragging(false); }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setDragging(false); }}
        />
        <polyline
          points="17,23 21,27 29,19"
          fill="none"
          stroke={checkColor}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="app-name-solid"
        style={{
          fontWeight: 800,
          fontSize: '1.6rem',
          userSelect: 'none',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: textColor,
          letterSpacing: '1.2px'
        }}
      >
        OrbitTasks
      </span>
    </span>
  );
};

// --- Layout and routes ---
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppHeader = () => {
  const { user, logout, updateUserProfile } = useContext(AuthContext);
  const { todos, toggleTodo, editTodo, deleteTodo, fetchTodos } = useTodosContext(); // NEW: Add fetchTodos
  const [showMenu, setShowMenu] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [completedPanelOpen, setCompletedPanelOpen] = useState(false);
  const [updatePasswordOpen, setUpdatePasswordOpen] = useState(false);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  // Theme toggle
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'light';
  });
  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const avatarRef = useRef();
  const navigate = useNavigate();
  useEffect(() => {
    function handleClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Avatar SVG: theme-aware
  const avatarSVG = theme === 'dark'
    ? `data:image/svg+xml;utf8,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'><circle cx='64' cy='64' r='62' fill='%23313b71'/><circle cx='64' cy='50' r='28' fill='%23fff'/><ellipse cx='64' cy='97' rx='38' ry='23' fill='%235d3ebc'/></svg>`
    : `data:image/svg+xml;utf8,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'><circle cx='64' cy='64' r='62' fill='%237c3aed'/><circle cx='64' cy='50' r='28' fill='%23a78bfa'/><ellipse cx='64' cy='97' rx='38' ry='23' fill='%235d3ebc'/></svg>`;

  const handleProfileSave = async (updatedData) => {
    try {
      await updateUserProfile(updatedData);
      setToastMessage('Profile updated successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage(error.message || "Failed to update profile");
      setToastType('error');
      setShowToast(true);
    }
  };

  const handlePasswordUpdate = async ({ password, confirmPassword }) => {
    try {
      await userService.updatePassword({ password, confirmPassword });
      setToastMessage('Password updated successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage(error.message || 'Failed to update password');
      setToastType('error');
      setShowToast(true);
    }
  };

  const closeToast = () => setShowToast(false);

  const handleMenuClick = (option) => {
    setShowMenu(false);
    if (option === "profile") {
      setProfileModalOpen(true); setCompletedPanelOpen(false); setUpdatePasswordOpen(false);setIsTimezoneModalOpen(false);
    } else if (option === "completed") {
      setCompletedPanelOpen(true); setProfileModalOpen(false); setUpdatePasswordOpen(false); setIsTimezoneModalOpen(false);
    } else if (option === "settings") {
      setUpdatePasswordOpen(true); setProfileModalOpen(false); setCompletedPanelOpen(false); setIsTimezoneModalOpen(false);
    } else if (option === "timezone") {
      setIsTimezoneModalOpen(true); setProfileModalOpen(false); setCompletedPanelOpen(false); setUpdatePasswordOpen(false);
    } else if (option === "logout") {
      logout(); setProfileModalOpen(false); setCompletedPanelOpen(false); setUpdatePasswordOpen(false); setIsTimezoneModalOpen(false);
    }
  };

  const completedTodos = React.useMemo(() => todos.filter(t => t.completed), [todos]);

  return (
    <>
      {showToast && <Toast message={toastMessage} type={toastType} onClose={closeToast} />}
      <header
        className="app-header"
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          height: '72px',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: 'none',
        }}
      >
        <div
          className="header-left"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flex: '1',
            height: '100%',
          }}
        >
          <BrandLogo theme={theme} />
        </div>
        {user && (
          <div
            className="header-right"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
            }}
          >
            <nav className="header-nav" />
            <div className="user-profile-menu" ref={avatarRef}>
              <button
                className="avatar-btn"
                onClick={() => setShowMenu(v => !v)}
                aria-label="User menu"
                type="button"
                style={{
                  marginTop: '10px',
                  width: '56px',
                  height: '56px',
                  padding: 0,
                }}
              >
                <img
                  src={avatarSVG}
                  alt="avatar"
                  className="user-avatar"
                  style={{ width: '56px', height: '56px' }}
                />
              </button>
              {showMenu && (
                <div className="profile-dropdown" role="menu" aria-label="User menu options" style={{ marginTop: '10px' }}>
                  <button onClick={() => handleMenuClick("profile")} type="button" className="dropdown-item">Profile</button>
                  <button onClick={() => handleMenuClick("completed")} type="button" className="dropdown-item">Completed Tasks</button>
                  <button onClick={() => handleMenuClick("settings")} type="button" className="dropdown-item">Update Password</button>
                  <button onClick={() => handleMenuClick("timezone")} type="button" className="dropdown-item">Change Timezone</button> 
                  <div className="theme-toggle-row dropdown-item" style={{ padding: "11px 24px 11px 22px", background: "none", margin: 0, cursor: "default" }}>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                  </div>
                  <button onClick={() => handleMenuClick("logout")} className="danger dropdown-item" type="button">Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <div style={{ height: '72px' }} />
      {profileModalOpen && user && (
        <UserProfileModal
          open={profileModalOpen}
          user={user}
          onClose={() => setProfileModalOpen(false)}
          onSave={handleProfileSave}
        />
      )}
      {updatePasswordOpen && (
        <UpdatePasswordModal
          open={updatePasswordOpen}
          onClose={() => setUpdatePasswordOpen(false)}
          onSave={handlePasswordUpdate}
        />
      )}
      {completedPanelOpen && user && (
        <CompletedTasksPanel
          open={completedPanelOpen}
          onClose={() => setCompletedPanelOpen(false)}
          completedTodos={completedTodos}
          toggleTodo={toggleTodo}
          onEdit={editTodo}
          deleteTodo={deleteTodo}
          setCategoryFilter={() => { }}
          setPriorityFilter={() => { }}
        />
      )}
      {isTimezoneModalOpen && user && (
        <TimezoneModal
          isOpen={isTimezoneModalOpen}
          onClose={() => setIsTimezoneModalOpen(false)}
        />
      )}
    </>
  );
};

function AppLayout() {
  const { isAuthenticated, user } = useContext(AuthContext);
  return (
    <div className="App">
      {isAuthenticated && <AppHeader />}
      {isAuthenticated && user && (
        <>
          <SideBannerLeft displayName={user.displayName} />
          {/* REMOVED: <SideBannerRight /> */}
        </>
      )}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />  
          <Route path="/dashboard" element={<ProtectedRoute><TodoList /></ProtectedRoute>} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfileModal
                open={true}
                user={user}
                onClose={() => window.history.back()}
                onSave={() => { /* noop or handle in modal */ }}
              />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} /> 
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TodosProvider>
        <Router>
          <AppLayout />
        </Router>
      </TodosProvider>
    </AuthProvider>
  );
}

export default App;
