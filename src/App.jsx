import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Trash2,
  Plus,
  Calendar,
  Sparkles,
  ListTodo,
  CheckCircle2,
  Clock,
  Search,
  Edit2,
  Save,
  RotateCcw,
  TrendingUp,
  Inbox
} from 'lucide-react';
import './App.css';

// Initial sample tasks to showcase the beautiful interface on first launch
const INITIAL_TASKS = [
  {
    id: 'sample-1',
    text: 'Review morning priorities and review design mockups',
    completed: true,
    priority: 'High',
    category: 'Work',
    createdAt: new Date(Date.now() - 3600000 * 3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'sample-2',
    text: 'Complete project documentation and push updates',
    completed: false,
    priority: 'Medium',
    category: 'Work',
    createdAt: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'sample-3',
    text: 'Go for a 30-minute refreshing evening walk',
    completed: false,
    priority: 'Low',
    category: 'Health',
    createdAt: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

export default function App() {
  // Load tasks from localStorage or initialize with sample tasks
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_tasks_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading tasks from localStorage', e);
    }
    return INITIAL_TASKS;
  });

  const [inputVal, setInputVal] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Work');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [toast, setToast] = useState(null);
  const [lastDeletedTask, setLastDeletedTask] = useState(null);

  const inputRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const previousProgressRef = useRef(0);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('daily_tasks_data', JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks to localStorage', e);
    }
  }, [tasks]);

  // Statistics calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const remainingTasks = totalTasks - completedTasks;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Trigger celebratory confetti on reaching 100%
  useEffect(() => {
    if (progressPercent === 100 && totalTasks > 0 && previousProgressRef.current < 100) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#9333ea', '#c084fc', '#38bdf8', '#34d399']
      });
      showToast('🎉 Bravo! You reached 100% daily completion!');
    }
    previousProgressRef.current = progressPercent;
  }, [progressPercent, totalTasks]);

  // Show Toast
  const showToast = (message, showUndo = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, showUndo });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Add Task
  const handleAddTask = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) {
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    const newTask = {
      id: 'task-' + Date.now(),
      text: trimmed,
      completed: false,
      priority,
      category,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTasks([newTask, ...tasks]);
    setInputVal('');
    showToast('Task added to your list');
    if (inputRef.current) inputRef.current.focus();
  };

  // Toggle Complete
  const handleToggleTask = (id) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const nextState = !task.completed;
          if (nextState) {
            showToast('Task marked as completed! 👏');
          }
          return { ...task, completed: nextState };
        }
        return task;
      })
    );
  };

  // Delete Task
  const handleDeleteTask = (task) => {
    setLastDeletedTask(task);
    setTasks(tasks.filter((t) => t.id !== task.id));
    showToast('Task removed', true);
  };

  // Undo Delete
  const handleUndoDelete = () => {
    if (lastDeletedTask) {
      setTasks((prev) => [lastDeletedTask, ...prev]);
      setLastDeletedTask(null);
      setToast(null);
    }
  };

  // Clear Completed Tasks
  const handleClearCompleted = () => {
    if (completedTasks === 0) return;
    const remaining = tasks.filter((t) => !t.completed);
    setTasks(remaining);
    showToast(`Cleared ${completedTasks} completed task${completedTasks > 1 ? 's' : ''}`);
  };

  // Start Editing
  const handleStartEdit = (task) => {
    setEditingId(task.id);
    setEditVal(task.text);
  };

  // Save Edit
  const handleSaveEdit = (id) => {
    const trimmed = editVal.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    setTasks(tasks.map((t) => (t.id === id ? { ...t, text: trimmed } : t)));
    setEditingId(null);
    showToast('Task updated');
  };

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filter status
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          task.text.toLowerCase().includes(query) ||
          task.priority.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [tasks, filter, searchQuery]);

  // Formatted Current Date
  const formattedDate = useMemo(() => {
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  }, []);

  // Motivational Progress Message
  const getProgressMotivation = () => {
    if (totalTasks === 0) return 'Add your tasks to jumpstart your daily productivity.';
    if (progressPercent === 100) return 'Outstanding! You conquered all tasks for today!';
    if (progressPercent >= 75) return 'Almost there! Just a couple more tasks to complete.';
    if (progressPercent >= 50) return 'Halfway through your goals! Keep the momentum going.';
    if (progressPercent > 0) return 'Great start! Step by step, progress builds up.';
    return 'Ready to roll! Pick your first task and dive in.';
  };

  return (
    <div className="app-wrapper">
      {/* Background ambient lighting */}
      <div className="ambient-decorations" aria-hidden="true">
        <div className="ambient-blob-1"></div>
        <div className="ambient-blob-2"></div>
        <div className="ambient-blob-3"></div>
      </div>

      <main className="app-container">
        {/* Header Section */}
        <header className="app-header">
          <div className="date-badge">
            <Calendar size={15} />
            <span>{formattedDate}</span>
          </div>

          <h1 className="main-title">
            Organize your day, <span className="gradient-text">one task at a time.</span>
          </h1>

          <p className="main-subtitle">
            Stay focused, hit your milestones, and build positive daily habits with effortless tracking.
          </p>
        </header>

        {/* Statistics Dashboard */}
        <section className="stats-grid" aria-label="Daily Task Statistics">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-total">
              <ListTodo size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{totalTasks}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-active">
              <Clock size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{remainingTasks}</span>
              <span className="stat-label">Remaining</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-completed">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{completedTasks}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </section>

        {/* Daily Progress Bar */}
        <section className="progress-container" aria-label="Daily Progress">
          <div className="progress-header">
            <div className="progress-title-group">
              <TrendingUp size={18} color="#7c3aed" />
              <h3>Daily Progress</h3>
            </div>
            <span className="progress-badge">{progressPercent}% Completed</span>
          </div>

          <div className="progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>

          <div className="progress-motivational-text">
            <span>{getProgressMotivation()}</span>
            <span>{completedTasks} of {totalTasks} done</span>
          </div>
        </section>

        {/* Input Card Form */}
        <section className="task-input-card">
          <form onSubmit={handleAddTask}>
            <div className="input-primary-row">
              <div className="input-icon-wrapper">
                <Sparkles size={20} />
              </div>
              <input
                ref={inputRef}
                type="text"
                className="task-text-input"
                placeholder="What would you like to achieve today?..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                maxLength={180}
              />
              <button type="submit" className="add-task-btn" id="add-task-btn">
                <Plus size={18} strokeWidth={2.5} />
                <span>Add Task</span>
              </button>
            </div>

            <div className="input-options-row">
              <div className="options-group">
                <span className="options-label">Priority:</span>
                <div className="priority-pills">
                  {['Low', 'Medium', 'High'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`pill-option priority-${p.toLowerCase().slice(0, 3)} ${priority === p ? 'active' : ''}`}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="options-group">
                <span className="options-label">Category:</span>
                <div className="category-pills">
                  {['Work', 'Personal', 'Health', 'Learning'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`pill-option ${category === c ? 'active' : ''}`}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* Filter and Search Controls */}
        <section className="filter-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              id="filter-all"
            >
              All <span className="tab-counter">{totalTasks}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
              id="filter-active"
            >
              Active <span className="tab-counter">{remainingTasks}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
              id="filter-completed"
            >
              Completed <span className="tab-counter">{completedTasks}</span>
            </button>
          </div>

          <div className="toolbar-actions">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {completedTasks > 0 && (
              <button
                className="clear-completed-btn"
                onClick={handleClearCompleted}
                title="Remove all completed tasks"
              >
                <RotateCcw size={14} />
                <span>Clear Done</span>
              </button>
            )}
          </div>
        </section>

        {/* Tasks List */}
        <section className="tasks-container" aria-label="Task List">
          {filteredTasks.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-wrapper">
                <Inbox size={32} />
              </div>
              <h3 className="empty-title">
                {searchQuery
                  ? 'No matching tasks found'
                  : filter === 'completed'
                  ? 'No tasks completed yet'
                  : filter === 'active'
                  ? 'All tasks are completed! 🎉'
                  : 'No tasks on your radar'}
              </h3>
              <p className="empty-desc">
                {searchQuery
                  ? `Try searching for something else or clear the search query.`
                  : filter === 'completed'
                  ? 'Check off tasks as you finish them to see them archived here.'
                  : filter === 'active'
                  ? 'You’ve conquered all your active tasks for the day. Feel free to relax or add more.'
                  : 'Start by typing a task above and press Enter or click "Add Task".'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isEditing = editingId === task.id;
              const priorityClass = `tag-priority-${task.priority.toLowerCase().slice(0, 3)}`;

              return (
                <div
                  key={task.id}
                  className={`task-card ${task.completed ? 'completed' : ''}`}
                >
                  <div className="task-main-content">
                    {/* Custom Checkbox */}
                    <div
                      className="checkbox-container"
                      onClick={() => handleToggleTask(task.id)}
                      role="checkbox"
                      aria-checked={task.completed}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleToggleTask(task.id);
                        }
                      }}
                    >
                      <div className={`custom-checkbox ${task.completed ? 'checked' : ''}`}>
                        {task.completed && <Check size={16} strokeWidth={3} />}
                      </div>
                    </div>

                    {/* Task Info or Edit Mode */}
                    <div className="task-info">
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={editVal}
                          autoFocus
                          onChange={(e) => setEditVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(task.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => handleSaveEdit(task.id)}
                        />
                      ) : (
                        <span
                          className={`task-title ${task.completed ? 'strike' : ''}`}
                          onClick={() => handleToggleTask(task.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {task.text}
                        </span>
                      )}

                      <div className="task-meta-row">
                        <span className={`tag-badge ${priorityClass}`}>
                          {task.priority}
                        </span>
                        <span className="tag-badge tag-category">
                          {task.category}
                        </span>
                        <span className="task-timestamp">
                          <Clock size={12} />
                          {task.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="task-actions">
                    {isEditing ? (
                      <button
                        className="action-btn"
                        onClick={() => handleSaveEdit(task.id)}
                        title="Save changes"
                      >
                        <Save size={16} />
                      </button>
                    ) : (
                      <button
                        className="action-btn"
                        onClick={() => handleStartEdit(task)}
                        title="Edit task"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteTask(task)}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Footer */}
        <footer className="app-footer">
          <p>Daily Task Tracker • Designed with purple accents & clean aesthetics</p>
          <p>Organize your day, one task at a time.</p>
        </footer>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification" role="status">
          <span>{toast.message}</span>
          {toast.showUndo && (
            <button className="toast-undo-btn" onClick={handleUndoDelete}>
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
