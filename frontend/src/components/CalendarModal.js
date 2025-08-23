// frontend/src/components/CalendarModal.js


import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { generateRecurringInstances } from '../utils/dateUtils'; // Import the utility
import { formatInTimeZone } from 'date-fns-tz'; // For timezone-aware formatting
import { useAuthContext } from '../context/AuthContext'; // NEW: To get user timezone
import '../styles/CalendarModal.css';


// --- DailyTasksModal Component ---
function DailyTasksModal({ date, tasks, onClose, onTaskClick, userTimeZone }) { // NEW: Add userTimeZone prop
    return ReactDOM.createPortal(
        <div className="daily-tasks-backdrop" onClick={onClose}>
            <div className="daily-tasks-modal" onClick={e => e.stopPropagation()}>
                <div className="daily-tasks-header">
                    <h2>
                        Tasks for {formatInTimeZone(date, userTimeZone, 'EEEE, MMMM d, yyyy')} {/* NEW: Timezone-aware formatting */}
                    </h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="daily-tasks-list">
                    {tasks.length > 0 ? (
                        tasks.map(task => (
                            <div key={task._id + (task.createdAt || task.dueDate)} className="task-detail-item">
                                <div className="task-detail-title-wrapper">
                                    <div className="task-detail-title">{task.text}</div>
                                    {task.priority && (
                                        <span className={`task-detail-priority-pill priority-${task.priority}`}>
                                            {task.priority}
                                        </span>
                                    )}
                                    {task.category && (
                                        <span className="task-detail-category-pill">{task.category}</span>
                                    )}
                                </div>
                                <div className="task-detail-notes-wrapper">
                                    {task.notes && <div className="task-detail-notes">{task.notes}</div>}
                                    <button className="view-details-btn" onClick={() => onTaskClick(task)}>
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">No tasks for this day.</div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}


// --- TaskDetailViewer Component ---
function TaskDetailViewer({ task, onClose, userTimeZone }) { // NEW: Add userTimeZone prop
    const popupRef = useRef(null);
    const [isClosing, setIsClosing] = useState(false);


    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };


    // NEW: Capitalize recurrence pattern
    const recurrencePatternText = task.recurrencePattern ? task.recurrencePattern.charAt(0).toUpperCase() + task.recurrencePattern.slice(1) : 'None';


    return ReactDOM.createPortal(
        <div className={`task-viewer-overlay ${isClosing ? 'fade-out' : ''}`} onClick={handleClose}>
            <div ref={popupRef} className="task-viewer-card" onClick={(e) => e.stopPropagation()}>
                <button className="task-viewer-close" onClick={handleClose}>&times;</button>
                <h2 className="task-viewer-name">{task.text}</h2>
                <div className="task-viewer-details-grid">
                    {task.priority && (
                        <div className="detail-item">
                            <span className="detail-label">Priority:</span>
                            <span className={`detail-value priority-${task.priority}`}>{task.priority}</span>
                        </div>
                    )}
                    {task.category && (
                        <div className="detail-item">
                            <span className="detail-label">Category:</span>
                            <span className="detail-value">{task.category}</span>
                        </div>
                    )}
                    {task.createdAt && (
                        <div className="detail-item">
                            <span className="detail-label">Created:</span>
                            <span className="detail-value">{formatInTimeZone(new Date(task.createdAt), userTimeZone, 'PPpp')}</span> {/* NEW: Timezone-aware */}
                        </div>
                    )}
                    {task.dueDate && (
                        <div className="detail-item">
                            <span className="detail-label">Due Date:</span>
                            <span className="detail-value">{formatInTimeZone(new Date(task.dueDate), userTimeZone, 'PPpp')}</span> {/* NEW: Timezone-aware */}
                        </div>
                    )}
                    {/* NEW: Recurrence Section */}
                    {task.isRecurring && (
                        <>
                            <div className="detail-item">
                                <span className="detail-label">Recurrence:</span>
                                <span className="detail-value">{recurrencePatternText}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Ends on:</span>
                                <span className="detail-value">
                                    {task.recurrenceEndsAt ? formatInTimeZone(new Date(task.recurrenceEndsAt), userTimeZone, 'PP') : 'Never'}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                <div className={`task-viewer-notes ${!task.notes ? 'placeholder' : ''}`}>
                    {task.notes || 'No notes for this task.'}
                </div>
            </div>
        </div>,
        document.body
    );
}


// --- CalendarModal Component ---
function CalendarModal({ tasks, onClose }) {
    const { user } = useAuthContext(); // NEW: Get user from context
    const userTimeZone = user?.timezone || localStorage.getItem('userTimeZone') || 'UTC'; // NEW: Get timezone with fallback


    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayTasks, setSelectedDayTasks] = useState(null);
    const [taskViewerOpen, setTaskViewerOpen] = useState(false);
    const [taskToView, setTaskToView] = useState(null);


    // NEW: Listen for timezone changes to refresh
    useEffect(() => {
        const handleTzChange = () => {
            // Could force re-render or refetch if needed
        };
        window.addEventListener('timezoneChanged', handleTzChange);
        return () => window.removeEventListener('timezoneChanged', handleTzChange);
    }, []);


    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const firstDayOfWeek = startOfMonth.getDay();


    const daysArray = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        daysArray.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }


    const expandedTasks = React.useMemo(() => {
        return tasks.flatMap(task => {
            return generateRecurringInstances(task, startOfMonth, endOfMonth);
        });
    }, [tasks, startOfMonth, endOfMonth]);


    const tasksForDay = useCallback((day) => {
        if (!day) return [];
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);


        return expandedTasks.filter(t => {
            if (t.completed) return false;


            const dueDate = t.dueDate ? new Date(t.dueDate) : null;
            const createdAt = t.createdAt ? new Date(t.createdAt) : null;


            const isDueOnDay = dueDate && dueDate >= dayStart && dueDate <= dayEnd;
            const isCreatedOnDay = createdAt && createdAt >= dayStart && createdAt <= dayEnd;


            if (isDueOnDay) return true;
            if (!dueDate && isCreatedOnDay) return true;
            return false;
        });
    }, [expandedTasks]);


    const goToPreviousMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };


    const goToNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };


    const handleShowMore = (day, allTasks) => {
        setSelectedDayTasks({ date: day, tasks: allTasks });
    };


    const closeDailyTasksModal = () => {
        setSelectedDayTasks(null);
    };


    const handleTaskClick = (task) => {
        setTaskToView(task);
        setTaskViewerOpen(true);
    };


    const closeTaskViewer = () => {
        setTaskViewerOpen(false);
        setTaskToView(null);
    };


    return ReactDOM.createPortal(
        <div className="calendar-right">
            <div className="calendar-modal">
                <div className="calendar-header">
                    <div className="nav-group">
                        <button className="nav-button" onClick={goToPreviousMonth} aria-label="Previous Month">&lt;</button><h2>{formatInTimeZone(currentDate, userTimeZone, 'LLLL yyyy')}</h2> {/* NEW: Timezone-aware month/year */}<button className="nav-button" onClick={goToNextMonth} aria-label="Next Month">&gt;</button>
                    </div>
                    <button className="close-btn" onClick={onClose} aria-label="Close Calendar Modal">&times;</button>
                </div>
                <div className="calendar-grid">
                    <div className="calendar-weekday">Sun</div>
                    <div className="calendar-weekday">Mon</div>
                    <div className="calendar-weekday">Tue</div>
                    <div className="calendar-weekday">Wed</div>
                    <div className="calendar-weekday">Thu</div>
                    <div className="calendar-weekday">Fri</div>
                    <div className="calendar-weekday">Sat</div>


                    {daysArray.map((day, index) => {
                        const allDayTasks = day ? tasksForDay(day) : [];
                        const hasTasks = allDayTasks.length > 0;
                        const displayTasks = allDayTasks.slice(0, 3);
                        const hasMoreTasks = allDayTasks.length > 3;
                        const isToday = day && day.toDateString() === new Date().toDateString();


                        return (
                            <div key={index} className={`calendar-day${!day ? ' empty' : ''}${hasTasks ? ' has-tasks' : ''} ${isToday ? ' today' : ''}`}>
                                {day && <div className="day-number">{day.getDate()}</div>}
                                <div className="tasks-list">
                                    {displayTasks.map(task => (
                                        <div key={task._id + (task.createdAt || task.dueDate)} className="task-item">
                                            <div className="task-title">{task.text}</div>
                                            {task.dueDate && (
                                                <div className="task-date due">
                                                    Due: {formatInTimeZone(new Date(task.dueDate), userTimeZone, 'PP')} {/* NEW: Timezone-aware */}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {allDayTasks.length > 0 && hasMoreTasks && (
                                        <button className="show-more-btn" onClick={() => handleShowMore(day, allDayTasks)}>
                                            +{allDayTasks.length - 3} more
                                        </button>
                                    )}
                                    {allDayTasks.length > 0 && !hasMoreTasks && (
                                        <button className="show-more-btn" onClick={() => handleShowMore(day, allDayTasks)}>
                                            View Day
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {selectedDayTasks && (
                <DailyTasksModal
                    date={selectedDayTasks.date}
                    tasks={selectedDayTasks.tasks}
                    onClose={closeDailyTasksModal}
                    onTaskClick={handleTaskClick}
                    userTimeZone={userTimeZone} // NEW: Pass timezone to DailyTasksModal
                />
            )}


            {taskViewerOpen && taskToView && (
                <TaskDetailViewer
                    task={taskToView}
                    onClose={closeTaskViewer}
                    userTimeZone={userTimeZone} // NEW: Pass timezone to TaskDetailViewer
                />
            )}
        </div>,
        document.body
    );
}


export default CalendarModal;
