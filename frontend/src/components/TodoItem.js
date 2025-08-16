import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuthContext } from '../context/AuthContext'; 
import { formatDueDate, formatCreatedAt } from '../utils/dateUtils';
import { formatInTimeZone } from 'date-fns-tz';
import '../styles/TodoItem.css';



// --- HELPER FUNCTIONS ---
function getContrastingTextColor(hexcolor) {
  if (!hexcolor || hexcolor === '#FFFFFF') return '#3839b0';
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#3839b0' : '#FFFFFF';
}



const CATEGORY_COLORS = {
  Personal: '#3b82f6', Work: '#8b5cf6', Home: '#14b8a6', Health: '#ec4899',
  Finance: '#eab308', Shopping: '#d946ef', Groceries: '#f97316',
  Sports: '#ef4444', Activity: '#22c55e', Others: '#6b7280',
};


const formatFullDateTime = (date, timeZone) => {
  if (!date) return 'Not set';
  return formatInTimeZone(date, timeZone, 'EEEE, MMMM d, yyyy h:mm:ss a');
};


const AlarmClockIcon = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke={color || "currentColor"} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);



function Tooltip({ targetRef, isVisible, content }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = React.useRef(null);



  const updatePosition = useCallback(() => {
    if (targetRef.current && tooltipRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      setPosition({
        top: targetRect.bottom + 8,
        left: targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2),
      });
    }
  }, [targetRef]);



  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]);



  if (!isVisible) return null;



  return ReactDOM.createPortal(
    <div ref={tooltipRef} className="date-tooltip visible"
      style={{ top: position.top, left: position.left }}>
      {content}
    </div>,
    document.body
  );
}



function RecurrencePopup({ targetRef, isVisible, recurrencePattern, recurrenceEndsAt, onClose, timeZone }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);



  const updatePosition = useCallback(() => {
    if (targetRef.current && popupRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();



      setPosition({
        top: targetRect.bottom + 8,
        left: targetRect.left + (targetRect.width / 2) - (popupRect.width / 2),
      });
    }
  }, [targetRef]);



  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]);



  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current &&
        !popupRef.current.contains(event.target) &&
        targetRef.current &&
        !targetRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose, targetRef]);



  if (!isVisible) return null;



  return ReactDOM.createPortal(
    <div className="recurrence-popup" ref={popupRef}
      style={{ top: position.top, left: position.left }}>
      <div><strong>Recurs:</strong> {recurrencePattern.charAt(0).toUpperCase() + recurrencePattern.slice(1)}</div>
      {recurrenceEndsAt ? (
        <div><strong>Ends On:</strong> {formatInTimeZone(new Date(recurrenceEndsAt), timeZone, 'PPP')}</div>
      ) : (
        <div><em>Does not end</em></div>
      )}
    </div>,
    document.body
  );
}



function TodoItem({ todo, toggleTodo, onEdit, deleteTodo, setCategoryFilter, setPriorityFilter }) {
  const { user } = useAuthContext(); // <-- 3. Get the user from context
  const userTimeZone = user?.timezone || localStorage.getItem('userTimeZone') || 'UTC'; // <-- 4. Get the timezone, with fallback
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);



  const [recurrencePopupVisible, setRecurrencePopupVisible] = useState(false);
  const recurrencePillRef = useRef(null);



  const [createdTooltipVisible, setCreatedTooltipVisible] = useState(false);
  const [dueTooltipVisible, setDueTooltipVisible] = useState(false);
  const createdDateRef = useRef(null);
  const dueDateRef = useRef(null);



  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });



  // Force re-render on timezone change
  const [refreshKey, setRefreshKey] = useState(0);


  useEffect(() => {
    const handleTzChange = () => {
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener('timezoneChanged', handleTzChange);
    return () => window.removeEventListener('timezoneChanged', handleTzChange);
  }, []);



  const closeMenu = useCallback(() => {
    if (!isMenuOpen || isMenuClosing) return;
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, 150);
  }, [isMenuOpen, isMenuClosing]);



  const updateMenuPosition = useCallback(() => {
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const menuWidth = 220;
      setMenuPosition({
        top: rect.bottom + 5,
        left: rect.right - menuWidth
      });
    }
  }, []);



  useEffect(() => {
    function handleClickOutside(event) {
      if (isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)) {
        closeMenu();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);



    if (isMenuOpen) {
      updateMenuPosition();
      window.addEventListener('scroll', updateMenuPosition);
      window.addEventListener('resize', updateMenuPosition);
    }



    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateMenuPosition);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isMenuOpen, closeMenu, updateMenuPosition]);



  useEffect(() => {
    if (isPopupOpen) {
      clearTimeout(popupTimeoutRef.current);
      setIsPopupVisible(true);
    } else {
      popupTimeoutRef.current = setTimeout(() => setIsPopupVisible(false), 300);
    }
    return () => clearTimeout(popupTimeoutRef.current);
  }, [isPopupOpen]);



  const toggleMenu = (e) => {
    e.stopPropagation();
    if (isMenuOpen) {
      closeMenu();
    } else {
      setIsMenuOpen(true);
    }
  };



  const handleMenuAction = (action) => {
    if (action) action();
    closeMenu();
  };



  const handlePopupClose = () => setIsPopupOpen(false);



  const toggleRecurrencePopup = (e) => {
    e.stopPropagation();
    setRecurrencePopupVisible((v) => !v);
  };



  const contrastingTextColor = getContrastingTextColor(todo.color);
  const cardStyle = {
    backgroundColor: todo.color || 'transparent',
    color: todo.color ? contrastingTextColor : '#d1d5db',
  };
  const categoryPillStyle = {
    backgroundColor: CATEGORY_COLORS[todo.category] || CATEGORY_COLORS['Others'],
  };



  if (todo.completed) {
    cardStyle.color = '#6b7280';
  }
  const dueDateInfo = formatDueDate(todo.dueDate, userTimeZone);
  return (
    <div key={refreshKey}>
      <div className={`todo-item-card ${todo.completed ? 'completed' : ''}`} style={cardStyle}>
        <div className="todo-main-col">
          <span className="todo-item-title" onClick={() => setIsPopupOpen(true)}>
            {todo.text}
          </span>
          {todo.notes && (
            <div className="todo-notes-field">{todo.notes}</div>
          )}
          <div className="todo-dates-row">
            <div
              ref={createdDateRef}
              className="date-container"
              onMouseEnter={() => setCreatedTooltipVisible(true)}
              onMouseLeave={() => setCreatedTooltipVisible(false)}
            >
              <span className="date-label">Created:</span>
              <span className="date-value">{formatCreatedAt(todo.createdAt, userTimeZone)}</span>
            </div>
          </div>
          <div className="todo-pills-row">
            <span
              className="filter-pill category-pill"
              style={categoryPillStyle}
              onClick={(e) => { e.stopPropagation(); setCategoryFilter(todo.category); }}
            >
              {todo.category || 'Others'}
            </span>
            {todo.isRecurring && (
              <span
                ref={recurrencePillRef}
                className="filter-pill recurring-pill"
                onClick={toggleRecurrencePopup}
              >
            🔁 Recurs
              </span>
            )}
          </div>
        </div>
        <div className="todo-right-col">
          <div className="right-col-top">
            {todo.completed ? (
              <div
                ref={dueDateRef}
                className="date-container due-date-icon"
                onMouseEnter={() => setDueTooltipVisible(true)}
                onMouseLeave={() => setDueTooltipVisible(false)}
              >
                <span className="date-value" style={{ color: formatDueDate(todo.dueDate, userTimeZone).color }}>
                  Completed: {todo.completedAt ? formatCreatedAt(todo.completedAt, userTimeZone) : '—'}
                </span>
              </div>
            ) : (
              todo.dueDate && (
                <div
                  ref={dueDateRef}
                  className="date-container due-date-icon"
                  onMouseEnter={() => setDueTooltipVisible(true)}
                  onMouseLeave={() => setDueTooltipVisible(false)}
                >
                  <AlarmClockIcon color={formatDueDate(todo.dueDate, userTimeZone).color} />
                  <span className="date-value" style={{ color: formatDueDate(todo.dueDate, userTimeZone).color }}>
                    {formatDueDate(todo.dueDate, userTimeZone).text}
                  </span>
                </div>
              )
            )}
          </div>
          <div className="right-col-bottom">
            {todo.priority && (
              <span
                className={`filter-pill priority-pill priority-${todo.priority}`}
                onClick={(e) => { e.stopPropagation(); setPriorityFilter(todo.priority); }}
              >
                {todo.priority}
              </span>
            )}
            <div className="menu-container">
              <button ref={menuButtonRef} className="menu-btn" onClick={toggleMenu} aria-label="Todo options">
                ⋮
              </button>
            </div>
          </div>
        </div>
      </div>



      <Tooltip targetRef={createdDateRef} isVisible={createdTooltipVisible} content={formatFullDateTime(todo.createdAt, userTimeZone)} />
      <Tooltip
        targetRef={dueDateRef}
        isVisible={dueTooltipVisible}
        content={formatFullDateTime(todo.completed ? todo.completedAt : todo.dueDate, userTimeZone)}
      />



      <RecurrencePopup
        targetRef={recurrencePillRef}
        isVisible={recurrencePopupVisible}
        recurrencePattern={todo.recurrencePattern}
        recurrenceEndsAt={todo.recurrenceEndsAt}
        onClose={() => setRecurrencePopupVisible(false)}
        timeZone={userTimeZone}
      />



      {isMenuOpen && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className={`menu-dropdown ${isMenuClosing ? 'closing' : ''}`}
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
        >
          {/* Edit option only if NOT completed */}
          {!todo.completed && (
            <div className="menu-item" onClick={() => handleMenuAction(() => onEdit(todo))}>
              <span className="menu-icon">✏️</span> Edit
            </div>
          )}
          <div className="menu-item" onClick={() => handleMenuAction(() => toggleTodo(todo._id, !todo.completed))}>
            <span className="menu-icon double-tick">
              <span>✓</span><span style={{ marginTop: '-8px' }}>✓</span>
            </span>
            {todo.completed ? 'Mark as Active' : 'Mark as Done'}
          </div>
          <div className="menu-item delete" onClick={() => handleMenuAction(() => deleteTodo(todo._id))}>
            <span className="menu-icon">🗑️</span> Delete
          </div>
        </div>,
        document.body
      )}



      {isPopupVisible && (
        <div className={`todo-popup-overlay ${!isPopupOpen ? 'fade-out' : ''}`} onClick={handlePopupClose}>
          <div className="todo-popup-card" onClick={(e) => e.stopPropagation()}>
            <button className="todo-popup-close" onClick={handlePopupClose}>&times;</button>
            <h2 className="todo-popup-name">{todo.text}</h2>
            <div className={`todo-popup-notes-text ${!todo.notes ? 'placeholder' : ''}`}>
              {todo.notes || 'No notes for this task.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



export default TodoItem;
