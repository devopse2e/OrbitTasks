import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { todoService } from '../services/api';
import { AuthContext } from './AuthContext';
import { addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TodosContext = createContext(null);

export const TodosProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isGuest = user?.isGuest;

  // Compute userTimeZone with fallbacks
  const userTimeZone = user?.timezone || localStorage.getItem('userTimeZone') || 'UTC';

  // Safe JSON parse helper for guest todo data in localStorage
  const safeParseJson = (json) => {
    if (!json || json === 'undefined') return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  // Fetch todos from API or localStorage depending on user type
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isGuest) {
        const guestItem = localStorage.getItem('guestTodos');
        const localTodos = safeParseJson(guestItem) || [];
        setTodos(localTodos);
      } else if (user) {
        const data = await todoService.getTodos();
        setTodos(Array.isArray(data) ? data : []);
      } else {
        setTodos([]);
      }
    } catch (err) {
      setError(err);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Listen for timezone changes to refetch todos (e.g., for recurrence re-calculation)
  useEffect(() => {
    const handleTzChange = () => {
      fetchTodos(); // Refetch to ensure any timezone-dependent logic updates
    };
    window.addEventListener('timezoneChanged', handleTzChange);
    return () => window.removeEventListener('timezoneChanged', handleTzChange);
  }, [fetchTodos]);

  // Helper to update guest todos and sync to localStorage
  const updateGuestTodos = useCallback((newTodosOrUpdater) => {
    setTodos((prev) => {
      const newTodos = typeof newTodosOrUpdater === 'function'
        ? newTodosOrUpdater(prev)
        : newTodosOrUpdater;
      try {
        localStorage.setItem('guestTodos', JSON.stringify(newTodos));
      } catch {}
      return newTodos;
    });
  }, []);

  // Add new todo
  const addTodo = useCallback(async (todoData) => {
    try {
      if (isGuest) {
        const newTodo = {
          ...todoData,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          completed: false,
        };
        updateGuestTodos((prev) => [newTodo, ...prev]);
      } else {
        const newTodo = await todoService.createTodo(todoData);
        setTodos((prev) => [newTodo, ...prev]);
      }
    } catch (err) {
      setError(err);
    }
  }, [isGuest, updateGuestTodos]);

  // Edit todo (support completedAt logic)
  const editTodo = useCallback(async (id, updates) => {
    try {
      if (isGuest) {
        updateGuestTodos((prev) =>
          prev.map((t) => t._id === id
            ? { ...t, ...updates, completedAt: updates.completed ? (t.completedAt || new Date().toISOString()) : null }
            : t)
        );
      } else {
        const prevTodo = todos.find((t) => t._id === id);
        let payload = { ...updates };
        if (typeof updates.completed === 'boolean') {
          payload.completedAt = updates.completed
            ? prevTodo?.completedAt || new Date().toISOString()
            : null;
        }
        const updatedTodo = await todoService.updateTodo(id, payload);
        setTodos((prev) => prev.map((t) => t._id === id ? updatedTodo : t));
      }
    } catch (err) {
      setError(err);
    }
  }, [isGuest, updateGuestTodos, todos]);

  // Delete todo
  const deleteTodo = useCallback(async (id) => {
    try {
      if (isGuest) {
        updateGuestTodos((prev) => prev.filter((t) => t._id !== id));
      } else {
        await todoService.deleteTodo(id);
        setTodos((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      setError(err);
    }
  }, [isGuest, updateGuestTodos]);

  // --- Helper function to calculate the next occurrence (zoned) ---
  const getNextOccurrence = (currentDueDate, pattern, interval) => {
    const zonedDate = toZonedTime(new Date(currentDueDate), userTimeZone);
    const utcDate = fromZonedTime(zonedDate, userTimeZone); // To UTC for addition

    let newUtcDate;
    switch (pattern) {
      case 'daily':
        newUtcDate = addDays(utcDate, interval);
        break;
      case 'weekly':
        newUtcDate = addWeeks(utcDate, interval);
        break;
      case 'monthly':
        newUtcDate = addMonths(utcDate, interval);
        break;
      case 'yearly':
        newUtcDate = addYears(utcDate, interval);
        break;
      default:
        return zonedDate; // Return original zoned if pattern is unknown
    }

    return toZonedTime(newUtcDate, userTimeZone); // Back to zoned
  };

  // --- Updated toggleTodo function with recurring logic ---
  const toggleTodo = useCallback(async (id, completed) => {
    const currentTodo = todos.find((t) => t._id === id);
    if (!currentTodo) {
      setError(new Error("Todo not found"));
      return;
    }

    // Toggle todo completion with optimistic UI update
    try {
      if (isGuest) {
        updateGuestTodos((prev) =>
          prev.map((t) =>
            t._id === id
              ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null }
              : t
          )
        );
      } else {
        // Optimistically update todos state
        setTodos((prev) => {
          const newPrev = prev.map((t) =>
            t._id === id
              ? { ...t, completed, completedAt: completed ? new Date().toISOString() : null }
              : t
          );
          return newPrev;
        });

        const currentTodo = todos.find((t) => t._id === id);
        if (!currentTodo) throw new Error("Todo not found");
        const payload = {
          completed,
          completedAt: completed ? new Date().toISOString() : null,
          recurrencePattern: currentTodo.recurrencePattern || "none",
        };
        await todoService.updateTodo(id, payload);

        // Refresh todos to sync with backend (important for recurring task new IDs)
        await fetchTodos();
      }
    } catch (err) {
      setError(err);
      await fetchTodos(); // Revert to backend state on error
    }
  }, [isGuest, updateGuestTodos, todos, fetchTodos, deleteTodo, userTimeZone]);

  return (
    <TodosContext.Provider
      value={{
        todos,
        loading,
        error,
        addTodo,
        editTodo,
        deleteTodo,
        toggleTodo,
        fetchTodos,
        setTodos,
      }}
    >
      {children}
    </TodosContext.Provider>
  );
};

export const useTodosContext = () => {
  const context = useContext(TodosContext);
  if (!context) {
    throw new Error("useTodosContext must be used within a TodosProvider");
  }
  return context;
};
