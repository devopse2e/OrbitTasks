import React, { useState, useRef, useEffect } from 'react';
import { todoService } from '../services/api';
import '../styles/TodoForm.css';

function TodoForm({ addTodo, editTodo, isAddModalOpen, isEditModalOpen, closeAddModal, closeEditModal, todoToEdit, loading }) {
  const [modalAnim, setModalAnim] = useState(false);

  // Form fields
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Personal');
  const [color, setColor] = useState('#FFFFFF');

  const [notesError, setNotesError] = useState('');
  const [formError, setFormError] = useState('');

  // Recurring task related
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('daily');
  const [recurrenceEndsAt, setRecurrenceEndsAt] = useState('');

  // NLP suggestion states
  const [nlpSuggestedDueDate, setNlpSuggestedDueDate] = useState(null);
  const [nlpSuggestedPriority, setNlpSuggestedPriority] = useState(null);
  const [nlpSuggestedCleanedTitle, setNlpSuggestedCleanedTitle] = useState('');
  const [nlpSuggestedRecurrencePattern, setNlpSuggestedRecurrencePattern] = useState(null);
  const [nlpSuggestedRecurrenceEndsAt, setNlpSuggestedRecurrenceEndsAt] = useState(null);
  const [nlpSuggestedRecurrenceInterval, setNlpSuggestedRecurrenceInterval] = useState(1);
  const [showNlpSuggestion, setShowNlpSuggestion] = useState(false);

  // NLP apply suppression flag
  const [nlpAppliedManually, setNlpAppliedManually] = useState(false);

  const [debouncedTaskText, setDebouncedTaskText] = useState('');
  const debounceTimeoutRef = useRef(null);
  const textRef = useRef(null);

  // Constants
  const CATEGORIES = ['Personal', 'Work', 'Home', 'Health', 'Finance', 'Shopping', 'Groceries', 'Sports', 'Activity', 'Others'];
  const COLORS = ['#FFFFFF', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'];
  const PRIORITIES = ['High', 'Medium', 'Low'];
  const RECURRENCE_PATTERNS = ['daily', 'weekly', 'monthly', 'yearly'];

  const isEditMode = Boolean(todoToEdit);
  const isModalOpen = isAddModalOpen || isEditModalOpen;

  // --- Reset form to initial state ---
  const resetForm = () => {
    setText('');
    setNotes('');
    setDueDate('');
    setDueTime('');
    setPriority('Medium');
    setCategory('Personal');
    setColor('#FFFFFF');
    setIsRecurring(false);
    setRecurrencePattern('daily');
    setRecurrenceEndsAt('');
    setNotesError('');
    setFormError('');
    setNlpSuggestedDueDate(null);
    setNlpSuggestedPriority(null);
    setNlpSuggestedCleanedTitle('');
    setNlpSuggestedRecurrencePattern(null);
    setNlpSuggestedRecurrenceEndsAt(null);
    setShowNlpSuggestion(false);
    setNlpAppliedManually(false);
  };

  // --- Debounce text input to reduce NLP calls ---
  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedTaskText(text);
    }, 500);
    return () => clearTimeout(debounceTimeoutRef.current);
  }, [text]);

  // --- Fetch NLP suggestions ---
  useEffect(() => {
    if (nlpAppliedManually) {
      // Suppress NLP suggestion popup just after manual application
      setShowNlpSuggestion(false);
      return;
    }

    const fetchNlpSuggestions = async () => {
      if (debouncedTaskText.trim().length > 3) {
        try {
          const result = await todoService.parseTaskDetails(debouncedTaskText);
          if (result) {
            setNlpSuggestedDueDate(result.dueDate ? new Date(result.dueDate) : null);
            setNlpSuggestedPriority(result.priority);
            setNlpSuggestedCleanedTitle(result.cleanedTitle);
            setNlpSuggestedRecurrencePattern(result.recurrencePattern && result.recurrencePattern !== 'none' ? result.recurrencePattern : null);
            setNlpSuggestedRecurrenceInterval(result.recurrenceInterval || 1);
            setNlpSuggestedRecurrenceEndsAt(result.recurrenceEndsAt ? new Date(result.recurrenceEndsAt) : null);
            setShowNlpSuggestion(!!(result.dueDate || result.priority || (result.recurrencePattern && result.recurrencePattern !== 'none')));
          } else {
            setShowNlpSuggestion(false);
          }
        } catch (err) {
          setShowNlpSuggestion(false);
        }
      } else {
        setShowNlpSuggestion(false);
      }
    };

    fetchNlpSuggestions();
  }, [debouncedTaskText, nlpAppliedManually]);

  // --- Populate form when modal opens and when editing ---
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => setModalAnim(true), 10);
      textRef.current?.focus();

      if (isEditMode && todoToEdit) {
        setText(todoToEdit.text || '');
        setNotes(todoToEdit.notes || '');
        setPriority(todoToEdit.priority || 'Medium');
        setCategory(todoToEdit.category || 'Personal');
        setColor(todoToEdit.color || '#FFFFFF');
        setIsRecurring(!!todoToEdit.isRecurring);

        setRecurrencePattern(todoToEdit.recurrencePattern && todoToEdit.recurrencePattern !== 'none'
          ? todoToEdit.recurrencePattern
          : 'daily'
        );

        if (todoToEdit.recurrenceEndsAt) {
          const recEndDate = todoToEdit.recurrenceEndsAt instanceof Date
            ? todoToEdit.recurrenceEndsAt
            : new Date(todoToEdit.recurrenceEndsAt);
          if (!isNaN(recEndDate.getTime())) {
            setRecurrenceEndsAt(recEndDate.toISOString().split('T')[0]);
          } else {
            setRecurrenceEndsAt('');
          }
        } else {
          setRecurrenceEndsAt('');
        }

        if (todoToEdit.dueDate) {
            const d = todoToEdit.dueDate instanceof Date ? todoToEdit.dueDate : new Date(todoToEdit.dueDate);
            if (!isNaN(d.getTime())) {
              const localYear = d.getFullYear();
              const localMonth = (d.getMonth() + 1).toString().padStart(2, '0');
              const localDate = d.getDate().toString().padStart(2, '0');
              setDueDate(`${localYear}-${localMonth}-${localDate}`);
          
              const hours = d.getHours().toString().padStart(2, '0');
              const minutes = d.getMinutes().toString().padStart(2, '0');
              setDueTime(`${hours}:${minutes}`);
            } else {
              setDueDate('');
              setDueTime('');
            }
          } else {
            setDueDate('');
            setDueTime('');
          }
      } else {
        resetForm();
      }
    } else {
      setModalAnim(false);
    }
  }, [isModalOpen, todoToEdit, isEditMode]);

  // --- Handle form changes ---
  // User typing resets the NLP suppression flag
  const handleTextChange = (e) => {
    setText(e.target.value);
    setNlpAppliedManually(false);  // reset suppression on new typing
    setShowNlpSuggestion(false);    // hide current suggestions until debounce
  };

  const handleNotesChange = e => {
    const val = e.target.value;
    setNotes(val);
    if (val.length > 400) setNotesError('Notes cannot exceed 400 characters.');
    else setNotesError('');
  };

  const closeModal = () => {
    setModalAnim(false);
    setTimeout(() => {
      isEditMode ? closeEditModal() : closeAddModal();
      resetForm();
    }, 350);
  };

  // --- Tab completion ---
  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const words = e.target.value.split(' ');
      const currentWord = words[words.length - 1].toLowerCase();
      const completions = {
        'wi': 'with',
        'on': 'on',
        'hi': 'high',
        'med': 'medium',
        'lo': 'low',
        'pri': 'priority'
      };
      if (completions[currentWord]) {
        const newText = [...words.slice(0, -1), completions[currentWord], ''].join(' ');
        setText(newText);
      }
    }
  };

  // --- Submit handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!text.trim()) {
      setFormError('Todo name is required.');
      return;
    }
    if (notes.length > 400) {
      setFormError('Notes cannot exceed 400 characters.');
      return;
    }

    let finalDueDateTime = null;
    if (dueDate) {
      const dateTimeString = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T00:00:00`;
      finalDueDateTime = new Date(dateTimeString);
      if (isNaN(finalDueDateTime.getTime())) finalDueDateTime = null;
    }

    const payload = {
      text: text.trim(),
      notes: notes.trim(),
      priority,
      dueDate: finalDueDateTime ? finalDueDateTime.toISOString() : null,
      category,
      color,
      isRecurring,
      recurrencePattern: isRecurring ? recurrencePattern : 'none',
      recurrenceEndsAt: isRecurring && recurrenceEndsAt ? new Date(recurrenceEndsAt).toISOString() : null,
      recurrenceInterval: isRecurring
        ? (nlpSuggestedRecurrencePattern && nlpSuggestedRecurrencePattern !== 'none' && nlpSuggestedRecurrenceInterval
            ? nlpSuggestedRecurrenceInterval   // from NLP if available
            : 1) // default
        : 1,
      recurrenceCustomRule: '',
    };
    

    try {
      if (isEditMode) await editTodo(todoToEdit._id, payload);
      else await addTodo(payload);
      closeModal();
    } catch (err) {
      setFormError(`Failed to ${isEditMode ? 'update' : 'add'} todo.`);
    }
  };

  // --- Apply NLP suggestions ---
  const applyNlpSuggestions = () => {
    if (nlpSuggestedCleanedTitle) setText(nlpSuggestedCleanedTitle);
    if (nlpSuggestedDueDate) {
        const d = nlpSuggestedDueDate;
        const localYear = d.getFullYear();
        const localMonth = (d.getMonth() + 1).toString().padStart(2, '0');
        const localDate = d.getDate().toString().padStart(2, '0');
        setDueDate(`${localYear}-${localMonth}-${localDate}`);
      
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        setDueTime(`${hours}:${minutes}`);
      }
    if (nlpSuggestedPriority) setPriority(nlpSuggestedPriority);
    if (nlpSuggestedRecurrencePattern) {
      setIsRecurring(true);
      setRecurrencePattern(nlpSuggestedRecurrencePattern);
    }
    if (nlpSuggestedRecurrenceEndsAt) {
      setRecurrenceEndsAt(nlpSuggestedRecurrenceEndsAt.toISOString().split('T')[0]);
    }
    if (nlpSuggestedRecurrenceInterval) {
      setNlpSuggestedRecurrenceInterval(nlpSuggestedRecurrenceInterval);
    }
    

    setShowNlpSuggestion(false);
    setNlpAppliedManually(true); // Suppress NLP suggestions until user edits text again
  };

  const handleManualInputChange = (setter, value) => {
    setter(value);
    setShowNlpSuggestion(false);
  };

  return (
    <>
      {isModalOpen && (
        <div className={`todo-modal-overlay ${modalAnim ? 'visible' : ''}`}>
          <div className={`todo-modal-content ${modalAnim ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal} aria-label="Close modal">&times;</button>
            <h3 className="modal-title">{isEditMode ? 'Edit Task' : 'Add Task'}</h3>
            <form onSubmit={handleSubmit} className="todo-form-modal">
              <input
                type="text"
                placeholder="Task Name"
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                className="form-input"
                ref={textRef}
                disabled={loading}
              />
              {showNlpSuggestion && (
                <div className="nlp-suggestion-box">
                  <span>
                    Detected:
                    {nlpSuggestedDueDate && <strong> Due: {nlpSuggestedDueDate.toLocaleString()} </strong>}
                    {nlpSuggestedPriority && <strong> Priority: {nlpSuggestedPriority} </strong>}
                    {nlpSuggestedRecurrencePattern && (
                    <strong>
                      Recurs: {nlpSuggestedRecurrencePattern.charAt(0).toUpperCase() + 
                              nlpSuggestedRecurrencePattern.slice(1)}
                      {nlpSuggestedRecurrenceInterval && nlpSuggestedRecurrenceInterval > 1
                        ? ` (every ${nlpSuggestedRecurrenceInterval})`
                        : ''}
                    </strong>
                  )}
                  </span>
                  <button type="button" onClick={applyNlpSuggestions} className="apply-suggestion-btn">Apply</button>
                </div>
              )}
              <textarea
                placeholder="Notes (optional, max 400 chars)"
                value={notes}
                onChange={handleNotesChange}
                className={`form-textarea ${notesError ? 'error' : ''}`}
                rows="4"
              ></textarea>
              {notesError && <span className="error-message">{notesError}</span>}

              <div className="due-date-group">
                <div className="input-group">
                  <label>Due Date:</label>
                  <input type="date" value={dueDate} onChange={e => handleManualInputChange(setDueDate, e.target.value)} className="form-input" disabled={loading} />
                </div>
                <div className="input-group">
                  <label>Time:</label>
                  <input type="time" value={dueTime} onChange={e => handleManualInputChange(setDueTime, e.target.value)} className="form-input" disabled={loading} />
                </div>
              </div>

              <div className="input-group">
                <label>Priority:</label>
                <div className="priority-selector">
                  {PRIORITIES.map(p => (
                    <button
                      type="button"
                      key={p}
                      className={`priority-btn priority-${p.toLowerCase()} ${priority === p ? 'selected' : ''}`}
                      onClick={() => handleManualInputChange(setPriority, p)}
                      disabled={loading}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Category:</label>
                <select value={category} onChange={e => handleManualInputChange(setCategory, e.target.value)} className="form-select" disabled={loading}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Color:</label>
                <div className="color-selector">
                  {COLORS.map(c => (
                    <div
                      key={c}
                      className={`color-swatch ${color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => handleManualInputChange(setColor, c)}
                      title={c}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Recurring Task Section */}
              <fieldset className="form-fieldset">
                <legend>Recurring Task</legend>
                <label>
                  <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} disabled={loading} />
                  Repeat this task
                </label>
                {isRecurring && (
                  <>
                    <div className="input-group">
                      <label htmlFor="recurrence-pattern">Repeat Every</label>
                      <select
                        id="recurrence-pattern"
                        value={recurrencePattern}
                        onChange={e => setRecurrencePattern(e.target.value)}
                        className="form-select"
                        disabled={loading}
                      >
                        {RECURRENCE_PATTERNS.map(pat => (
                          <option key={pat} value={pat}>{pat.charAt(0).toUpperCase() + pat.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label htmlFor="recurrence-ends">Ends On (optional)</label>
                      <input
                        type="date"
                        id="recurrence-ends"
                        value={recurrenceEndsAt}
                        onChange={e => setRecurrenceEndsAt(e.target.value)}
                        className="form-input"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </fieldset>

              {formError && <span className="error-message">{formError}</span>}

              <button type="submit" className="form-submit-btn" disabled={loading}>
                {loading ? 'Processing...' : (isEditMode ? 'Update Task' : 'Add Task')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default TodoForm;
