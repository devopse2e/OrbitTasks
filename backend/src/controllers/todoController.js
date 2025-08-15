const Todo = require('../models/todoModel');
const mongoose = require('mongoose');

// Helper for recurrence
function calculateNextDueDate(currentDueDate, pattern, interval = 1) {
  if (!(currentDueDate instanceof Date)) {
    currentDueDate = currentDueDate ? new Date(currentDueDate) : new Date();
  }
  const nextDate = new Date(currentDueDate);
  switch (pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
    case 'custom':
      return null;
    default:
      return null;
  }
  return nextDate;
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
      todoData.nextDueDate = calculateNextDueDate(new Date(dueDate), todoData.recurrencePattern, todoData.recurrenceInterval);
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
    await todo.save();

    // Create next recurring task if task completed and recurring
    if (changesCompletion && completed && todo.isRecurring) {
      const now = new Date();

      let baseDate = todo.dueDate ? new Date(todo.dueDate) : now;
      const recurrenceEndsAtDate = todo.recurrenceEndsAt ? new Date(todo.recurrenceEndsAt) : null;

      let nextDue = calculateNextDueDate(baseDate, todo.recurrencePattern, todo.recurrenceInterval);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (nextDue < today && (!recurrenceEndsAtDate || nextDue <= recurrenceEndsAtDate)) {
        baseDate = nextDue;
        nextDue = calculateNextDueDate(baseDate, todo.recurrencePattern, todo.recurrenceInterval);
      }

      if (nextDue && (!recurrenceEndsAtDate || nextDue <= recurrenceEndsAtDate)) {
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
          nextDueDate: calculateNextDueDate(nextDue, todo.recurrencePattern, todo.recurrenceInterval),
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
