const express = require('express');
const router = express.Router();

const todoController = require('../controllers/todoController');

// FIX: Import the new authentication middleware
const { protect } = require('../middleware/auth');

const { validateTodo, validateTodoUpdate } = require('../middleware/validation'); // Assuming this is the correct path

// GET /api/todos - Fetch all todos for the logged-in user
// FIX: Apply the 'protect' middleware to this route
router.get('/', protect, todoController.getAllTodos);

// POST /api/todos - Create a new todo for the logged-in user
// FIX: Apply the 'protect' middleware to this route
router.post('/', protect, validateTodo, todoController.createTodo);

// PUT /api/todos/:id - Update a todo for the logged-in user
// FIX: Apply the 'protect' middleware to this route
router.put('/:id', protect, validateTodoUpdate, todoController.updateTodo);

// DELETE /api/todos/:id - Delete a todo for the logged-in user
// FIX: Apply the 'protect' middleware to this route
router.delete('/:id', protect, todoController.deleteTodo);

module.exports = router;
