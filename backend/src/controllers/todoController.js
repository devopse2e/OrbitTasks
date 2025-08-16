const Todo = require('../models/todoModel');
const User = require('../models/userModel'); // Import User to fetch timezone
const mongoose = require('mongoose');
const { addDays, addWeeks, addMonths, addYears, isAfter, parseISO } = require('date-fns');
const { toZonedTime, fromZonedTime } = require('date-fns-tz');

// Safe parseISO helper to handle non-string inputs
function safeParseISO(dateOrString) {
  if (!dateOrString) return null;
  if (typeof dateOrString === 'string') return parseISO(dateOrString);
  if (dateOrString instanceof Date) return dateOrString;
  return null;
}

// Helper for recurrence (timezone-aware)
function calculateNextDueDate(currentDueDate, pattern, interval = 1, timeZone = 'UTC') {
  // Accept both Date and string ISO formats
  let zonedDate;
  if (typeof currentDueDate === 'string') {
    zonedDate = toZonedTime(parseISO(currentDueDate), timeZone);
  } else if (currentDueDate instanceof Date) {
    zonedDate = toZonedTime(currentDueDate, timeZone);
  } else {
    zonedDate = toZonedTime(new Date(), timeZone);
  }

  let nextUtcDate;
  switch (pattern) {
    case 'daily':
      nextUtcDate = addDays(zonedDate, interval);
      break;
    case 'weekly':
      nextUtcDate = addWeeks(zonedDate, interval);
      break;
    case 'monthly':
      nextUtcDate = addMonths(zonedDate, interval);
      break;
    case 'yearly':
      nextUtcDate = addYears(zonedDate, interval);
      break;
    case 'custom':
      return null;
    default:
      return null;
  }

  return fromZonedTime(nextUtcDate, timeZone).toISOString();
}

// Get all todos for logged-in user
const getAllTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    next(error);
  }
};

// Create new todo
const createTodo = async (req, res, next) => {
  try {
    const { text, notes, dueDate, priority, category, color, isRecurring, recurrencePattern, recurrenceEndsAt, recurrenceInterval, recurrenceCustomRule } = req.body;

    // Fetch user's timezone
    const user = await User.findById(req.user.id).select('timezone');
    const userTimeZone = user?.timezone || 'UTC';

    // Auto-detect recurring tasks based on flag OR pattern
    const recurringFlag = Boolean(isRecurring) || (recurrencePattern && recurrencePattern !== 'none');

    const todoData = {
      userId: req.user.id,
      text,
      notes: notes || '',
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      category: category || 'Personal',
      color: color || '#FFFFFF',
      isRecurring: recurringFlag,
      recurrencePattern: recurringFlag ? recurrencePattern || 'none' : 'none',
      recurrenceEndsAt: recurrenceEndsAt || null,
      recurrenceInterval: Math.max(1, parseInt(recurrenceInterval) || 1),
      recurrenceCustomRule: recurrenceCustomRule || '',
      originalTaskId: null,
      nextDueDate: null,
      completed: false,
      completedAt: null
    };

    if (todoData.isRecurring && dueDate) {
      todoData.nextDueDate = calculateNextDueDate(dueDate, todoData.recurrencePattern, todoData.recurrenceInterval, userTimeZone);
    }

    const todo = new Todo(todoData);
    await todo.save();

    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
};

// Update existing todo
const updateTodo = async (req, res, next) => {
  try {
    const { text, notes, completed, dueDate, priority, category, color, isRecurring, recurrencePattern, recurrenceEndsAt, recurrenceInterval, recurrenceCustomRule } = req.body;

    // Fetch user's timezone
    const user = await User.findById(req.user.id).select('timezone');
    const userTimeZone = user?.timezone || 'UTC';

    const updates = {};
    if (text !== undefined) updates.text = text;
    if (notes !== undefined) updates.notes = notes || '';
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category;
    if (color !== undefined) updates.color = color;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (isRecurring !== undefined || (recurrencePattern && recurrencePattern !== 'none')) {
      updates.isRecurring = Boolean(isRecurring) || (recurrencePattern && recurrencePattern !== 'none');
    }
    if (recurrencePattern !== undefined) updates.recurrencePattern = recurrencePattern;
    if (recurrenceEndsAt !== undefined) updates.recurrenceEndsAt = recurrenceEndsAt;
    if (recurrenceInterval !== undefined) updates.recurrenceInterval = Math.max(1, parseInt(recurrenceInterval));
    if (recurrenceCustomRule !== undefined) updates.recurrenceCustomRule = recurrenceCustomRule;

    let todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const wasCompleted = todo.completed;
    const changesCompletion = (completed !== undefined) && (completed !== wasCompleted);

    if (completed !== undefined) {
      updates.completed = completed;
      updates.completedAt = completed ? new Date() : null;
    }

    Object.assign(todo, updates);

    // Update nextDueDate if recurrence details changed
    if (todo.isRecurring && todo.dueDate) {
      todo.nextDueDate = calculateNextDueDate(todo.dueDate, todo.recurrencePattern, todo.recurrenceInterval, userTimeZone);
    }

    await todo.save();

    // Create next recurring task if task completed and recurring
    if (changesCompletion && completed && todo.isRecurring) {
      const now = new Date();

      let baseDate = safeParseISO(todo.dueDate) || now;
      const recurrenceEndsAtDate = safeParseISO(todo.recurrenceEndsAt);

      let nextDue = calculateNextDueDate(baseDate.toISOString(), todo.recurrencePattern, todo.recurrenceInterval, userTimeZone);
      const today = fromZonedTime(now, userTimeZone);
      today.setHours(0, 0, 0, 0);

      while (isAfter(today, safeParseISO(nextDue)) && (!recurrenceEndsAtDate || isAfter(recurrenceEndsAtDate, safeParseISO(nextDue)))) {
        baseDate = safeParseISO(nextDue);
        nextDue = calculateNextDueDate(baseDate.toISOString(), todo.recurrencePattern, todo.recurrenceInterval, userTimeZone);
      }

      if (nextDue && (!recurrenceEndsAtDate || !isAfter(safeParseISO(nextDue), recurrenceEndsAtDate))) {
        const nextTodo = new Todo({
          userId: todo.userId,
          text: todo.text,
          notes: todo.notes,
          dueDate: nextDue,
          priority: todo.priority,
          category: todo.category,
          color: todo.color,
          isRecurring: todo.isRecurring,
          recurrencePattern: todo.recurrencePattern,
          recurrenceEndsAt: todo.recurrenceEndsAt,
          recurrenceInterval: todo.recurrenceInterval,
          recurrenceCustomRule: todo.recurrenceCustomRule,
          originalTaskId: todo.originalTaskId || todo._id,
          nextDueDate: calculateNextDueDate(nextDue, todo.recurrencePattern, todo.recurrenceInterval, userTimeZone),
          completed: false,
          completedAt: null,
        });
        await nextTodo.save();
      }
    }

    res.json(todo);
  } catch (error) {
    next(error);
  }
};

// Delete todo by ID
const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo
};
