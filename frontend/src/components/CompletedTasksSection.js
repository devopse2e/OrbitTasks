import React, { useEffect, useRef, useState } from 'react';
import TodoItem from './TodoItem';
import '../styles/TodoList.css'; // reuse existing styles

const CompletedTasksSection = ({
  completedTodos = [],
  toggleTodo,
  deleteTodo,
  setCategoryFilter,
  setPriorityFilter,
  userTimeZone, // NEW: Add userTimeZone prop
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bodyRef = useRef(null);

  // Pagination for completed tasks
  const TASKS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(completedTodos.length / TASKS_PER_PAGE);

  const currentTasks = completedTodos.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE
  );

  // Collapse animation effect
  useEffect(() => {
    const body = bodyRef.current;
    if (body) {
      const content = body.querySelector('.todo-section-content-comp');
      const contentHeight = content?.scrollHeight || 0;
      body.style.maxHeight = isCollapsed ? '0px' : `${contentHeight + 50 /* extra padding for pagination */}px`;
      // Add extra pixels if needed to accomodate pagination height
    }
  }, [isCollapsed, currentTasks]);

  // Reset page if current page exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [completedTodos.length, currentPage, totalPages]);

  // Listen for timezone changes to refresh (re-format dates)
  useEffect(() => {
    const handleTzChange = () => {
      // No need to refetch, but force re-render if needed (dates will re-format via props)
    };
    window.addEventListener('timezoneChanged', handleTzChange);
    return () => window.removeEventListener('timezoneChanged', handleTzChange);
  }, []);

  const handlePageChange = (pageNumber) => {
    if (pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className={`todo-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div 
        className="todo-section-header"
      >
        <span>
          Completed ({completedTodos.length})
          <span
            className={`chevron ${isCollapsed ? 'up' : 'down'}`}
            style={{ marginLeft: 8, cursor: 'pointer' }}
            aria-hidden="true"
            role="button"
            tabIndex={0}
            onClick={() => setIsCollapsed(!isCollapsed)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsCollapsed(!isCollapsed);
              }
            }}
            aria-label={isCollapsed ? 'Expand completed tasks' : 'Collapse completed tasks'}
            aria-expanded={!isCollapsed}
            aria-controls="completed-tasks-list"
          />
        </span>
      </div>

      <div ref={bodyRef} className="todo-section-body-comp" id="completed-tasks-list" >
        <div className="todo-section-content-comp">
          {currentTasks.length > 0 ? (
            currentTasks.map(todo => (
              <TodoItem
                key={todo._id}
                todo={todo}
                toggleTodo={toggleTodo}
                deleteTodo={deleteTodo}
                setCategoryFilter={setCategoryFilter}
                setPriorityFilter={setPriorityFilter}
                userTimeZone={userTimeZone} // NEW: Pass userTimeZone to TodoItem
              />
            ))
          ) : (
            <div className="empty-state">No completed tasks yet.</div>
          )}
        </div>

        {totalPages > 1 && (
          <nav
            className="pagination"
            aria-label="Completed tasks pagination"
            style={{
              marginTop: 12,
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
              userSelect: 'none',
            }}
          >
            {[...Array(totalPages)].map((_, idx) => {
              const page = idx + 1;
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`pagination-btn ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 12,
                    border: 'none',
                    cursor: isActive ? 'default' : 'pointer',
                    color: isActive ? '#fff' : '#7c3aed',
                    backgroundColor: isActive ? '#7c3aed' : 'transparent',
                    fontWeight: isActive ? '600' : '500',
                    transition: 'background-color 0.2s, color 0.2s',
                  }}
                  disabled={isActive}
                >
                  {page}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};

export default CompletedTasksSection;
