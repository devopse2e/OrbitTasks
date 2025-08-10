import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTodosContext } from '../context/TodosContext';
import TodoForm from './TodoForm';
import TodoItem from './TodoItem';
import LoadingSpinner from './LoadingSpinner';
import CalendarModal from './CalendarModal';
import '../styles/TodoList.css';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

function TodoList() {
  const { 
    todos, 
    setTodos,
    toggleTodo: toggleTodoOriginal, 
    addTodo, 
    editTodo, 
    deleteTodo, 
    loading, 
    error, 
    fetchTodos 
  } = useTodosContext();

  // Collapsed state
  const [isActiveCollapsed, setIsActiveCollapsed] = useState(false);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  // Filtering & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [sortBy, setSortBy] = useState('priority');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activePriority, setActivePriority] = useState(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Refs
  const sortMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const activeBodyRef = useRef(null);

  // Pagination for active tasks
  const TASKS_PER_PAGE = 4;
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);

  // Modal handlers
  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);
  const handleOpenEditModal = (todo) => {
    setEditingTodo(todo);
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => setEditingTodo(null), 350);
  };

  // Close sort menu on outside click
  const closeSortMenu = useCallback(() => setIsSortMenuOpen(false), []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        closeSortMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSortMenu]);

  // Focus the search input when visible
  useEffect(() => {
    if (isSearchVisible) {
      searchInputRef.current?.focus();
    }
  }, [isSearchVisible]);

  // Priority rank for sorting
  const priorityRank = { High: 1, Medium: 2, Low: 3 };

  // Filtering and sorting todos
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = [...todos];
    if (activeCategory) {
      filtered = filtered.filter(todo => todo.category === activeCategory);
    }
    if (activePriority) {
      filtered = filtered.filter(todo => todo.priority === activePriority);
    }
    if (searchTerm) {
      filtered = filtered.filter(todo =>
        todo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.notes && todo.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'priority':
        default:
          const aRank = priorityRank[a.priority] || 2;
          const bRank = priorityRank[b.priority] || 2;
          if (aRank !== bRank) return aRank - bRank;
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [todos, searchTerm, sortBy, activeCategory, activePriority]);

  // Separate active todos
  const activeTodos = filteredAndSortedTodos.filter(todo => !todo.completed);

  // Pagination logic
  const activeTotalPages = Math.ceil(activeTodos.length / TASKS_PER_PAGE) || 1;
  const activeCurrentTasks = activeTodos.slice(
    (activeCurrentPage - 1) * TASKS_PER_PAGE,
    activeCurrentPage * TASKS_PER_PAGE
  );

  // Reset page if it goes out of range — auto-back to highest valid page
  useEffect(() => {
    if (activeCurrentPage > activeTotalPages) {
      setActiveCurrentPage(activeTotalPages);
    }
    if (activeTotalPages === 0) {
      setActiveCurrentPage(1);
    }
  }, [activeTodos.length, activeCurrentPage, activeTotalPages]);

  // Fix: Expand/collapse animation after deletes or page changes
  useEffect(() => {
    const body = activeBodyRef.current;
    if (body) {
      setTimeout(() => {
        const content = body.querySelector('.todo-section-content');
        const contentHeight = content?.scrollHeight || 0;
        body.style.maxHeight = isActiveCollapsed ? '0px' : `${contentHeight}px`;
      }, 0);
    }
  }, [
    isActiveCollapsed,
    activeCurrentPage,
    activeCurrentTasks.length,
    activeTodos.length,
    todos.length,
    searchTerm,
    activeCategory,
    activePriority
  ]);

  // Optimistic toggle with immediate UI update before backend sync
  const toggleTodo = async (id, newCompletedValue) => {
    try {
      setTodos(prev =>
        prev.map(todo =>
          todo._id === id
            ? { ...todo, completed: newCompletedValue, completedAt: newCompletedValue ? new Date().toISOString() : null }
            : todo
        )
      );
      await toggleTodoOriginal(id, newCompletedValue);
      await fetchTodos();
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  };

  if (loading && todos.length === 0) return <div className="center-container"><LoadingSpinner /></div>;
  if (error) return <div className="center-container error-state">Error: {error.message}</div>;

  return (
    <div className="todo-list-main">
      {/* Header & controls */}
      <div className="app-controls-header">
        <button className="add-todo-btn" onClick={handleOpenAddModal}>Add New Task</button>

        <div className="header-right-controls">
          <div className={`search-container ${isSearchVisible ? 'active' : ''}`}>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="control-btn" onClick={() => setIsSearchVisible(!isSearchVisible)}>
              <SearchIcon />
            </button>
          </div>
          <button className="control-btn" onClick={() => setIsCalendarModalOpen(true)}>
            <CalendarIcon />
          </button>
          <div className="sort-container" ref={sortMenuRef}>
            <button className="control-btn" onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}>
              <FilterIcon />
            </button>
            {isSortMenuOpen && (
              <div className="sort-menu">
                <div className="sort-menu-header">Sort by</div>
                <div className={`sort-option ${sortBy === 'priority' ? 'selected' : ''}`} onClick={() => { setSortBy('priority'); closeSortMenu(); }}>
                  Priority
                </div>
                <div className={`sort-option ${sortBy === 'dueDate' ? 'selected' : ''}`} onClick={() => { setSortBy('dueDate'); closeSortMenu(); }}>
                  Due Date
                </div>
                <div className={`sort-option ${sortBy === 'createdAt' ? 'selected' : ''}`} onClick={() => { setSortBy('createdAt'); closeSortMenu(); }}>
                  Creation Date
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Todo Form Modal */}
      <TodoForm
        addTodo={addTodo}
        editTodo={editTodo}
        isAddModalOpen={isAddModalOpen}
        isEditModalOpen={isEditModalOpen}
        closeAddModal={handleCloseAddModal}
        closeEditModal={handleCloseEditModal}
        todoToEdit={editingTodo}
        loading={loading}
      />

      {/* Active Filters Pills */}
      {(activeCategory || activePriority) && (
        <div className="active-filters-container">
          {activeCategory && (
            <div className="active-filter-pill" onClick={() => setActiveCategory(null)}>
              <span>Category: {activeCategory}</span>
              <button className="clear-filter-btn">&times;</button>
            </div>
          )}
          {activePriority && (
            <div className="active-filter-pill" onClick={() => setActivePriority(null)}>
              <span>Priority: {activePriority}</span>
              <button className="clear-filter-btn">&times;</button>
            </div>
          )}
        </div>
      )}

      {/* Active Tasks Section */}
      <div className={`todo-section ${isActiveCollapsed ? 'collapsed' : ''}`}>
        <div
          className="todo-section-header"
          onClick={() => setIsActiveCollapsed(!isActiveCollapsed)}
        >
          <span>
            Active Tasks ({activeTodos.length})
            <span className={`chevron ${isActiveCollapsed ? 'up' : 'down'}`}></span>
          </span>
        </div>

        <div ref={activeBodyRef} className="todo-section-body">
          <div className="todo-section-content">
            {activeCurrentTasks.length > 0 ? (
              activeCurrentTasks.map(todo => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  toggleTodo={toggleTodo}
                  onEdit={handleOpenEditModal}
                  deleteTodo={deleteTodo}
                  setCategoryFilter={setActiveCategory}
                  setPriorityFilter={setActivePriority}
                />
              ))
            ) : (
              <div className="empty-state">
                {searchTerm || activeCategory || activePriority ? 'No matching tasks found.' : 'No active tasks. Add one!'}
              </div>
            )}
          </div>

          {/* Pagination for active tasks */}
          {activeTotalPages > 1 && (
            <nav
              className="pagination"
              aria-label="Active tasks pagination"
              style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
                userSelect: 'none',
              }}
            >
              {[...Array(activeTotalPages)].map((_, idx) => {
                const page = idx + 1;
                const isActive = page === activeCurrentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setActiveCurrentPage(page)}
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

      {/* Calendar Modal */}
      {isCalendarModalOpen && (
        <CalendarModal tasks={todos} onClose={() => setIsCalendarModalOpen(false)} />
      )}
    </div>
  );
}

export default TodoList;
