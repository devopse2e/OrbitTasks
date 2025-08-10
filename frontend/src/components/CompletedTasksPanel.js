import React, { useState, useRef, useEffect } from 'react';
import CompletedTasksSection from './CompletedTasksSection';
import '../styles/CompletedTasksPanel.css';

const PANEL_INIT_X = () => Math.max(window.innerWidth / 2 - 320, 40); // Centers modal, fallback
const PANEL_INIT_Y = () => Math.max(window.innerHeight * 0.18, 24);

const CompletedTasksPanel = ({
  open,
  onClose,
  completedTodos = [],
  toggleTodo,
  onEdit,
  deleteTodo,
  setCategoryFilter,
  setPriorityFilter,
}) => {
  const panelRef = useRef(null);

  // Track dragging state and position
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (open) setPosition({ x: PANEL_INIT_X(), y: PANEL_INIT_Y() });
  }, [open]);

  const handleMouseDown = (e) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="completed-tasks-floating-card"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: 2000,
      }}
      onMouseDown={handleMouseDown} // drag by clicking anywhere on modal
    >
      <button
        className="completed-tasks-close-btn"
        type="button"
        aria-label="Close"
        onClick={onClose}
      >
        ×
      </button>

      <CompletedTasksSection
        completedTodos={completedTodos}
        toggleTodo={toggleTodo}
        onEdit={onEdit}
        deleteTodo={deleteTodo}
        setCategoryFilter={setCategoryFilter}
        setPriorityFilter={setPriorityFilter}
      />
    </div>
  );
};

export default CompletedTasksPanel;
