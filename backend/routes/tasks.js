const express = require('express');
const database = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all tasks
router.get('/', authenticateToken, (req, res) => {
  const { diary_entry_id, completed, due_date } = req.query;
  const userId = req.user.id;
  
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (diary_entry_id) {
    query += ' AND diary_entry_id = ?';
    params.push(diary_entry_id);
  }

  if (completed !== undefined) {
    query += ' AND completed = ?';
    params.push(completed === 'true' ? 1 : 0);
  }

  if (due_date) {
    query += ' AND due_date = ?';
    params.push(due_date);
  }

  query += ' ORDER BY created_at DESC';

  database.getDb().all(query, params, (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching tasks' });
    }
    res.json(tasks);
  });
});

// Get single task
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  database.getDb().get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching task' });
      }

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    }
  );
});

// Create task
router.post('/', authenticateToken, (req, res) => {
  const { diary_entry_id, title, description, due_date, priority } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Verify diary entry belongs to user if provided
  if (diary_entry_id) {
    database.getDb().get(
      'SELECT id FROM diary_entries WHERE id = ? AND user_id = ?',
      [diary_entry_id, userId],
      (err, entry) => {
        if (err || !entry) {
          return res.status(404).json({ error: 'Diary entry not found' });
        }

        createTask();
      }
    );
  } else {
    createTask();
  }

  function createTask() {
    database.getDb().run(
      'INSERT INTO tasks (user_id, diary_entry_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, diary_entry_id || null, title, description || null, due_date || null, priority || 'medium'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error creating task' });
        }

        res.status(201).json({
          message: 'Task created successfully',
          id: this.lastID
        });
      }
    );
  }
});

// Update task
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, completed, priority } = req.body;
  const userId = req.user.id;

  database.getDb().run(
    'UPDATE tasks SET title = ?, description = ?, due_date = ?, completed = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [title, description, due_date, completed ? 1 : 0, priority, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating task' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ message: 'Task updated successfully' });
    }
  );
});

// Delete task
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  database.getDb().run(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting task' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ message: 'Task deleted successfully' });
    }
  );
});

// Toggle task completion
router.patch('/:id/toggle', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  database.getDb().get(
    'SELECT completed FROM tasks WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching task' });
      }

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const newCompleted = task.completed ? 0 : 1;

      database.getDb().run(
        'UPDATE tasks SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [newCompleted, id, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error updating task' });
          }

          res.json({ 
            message: 'Task updated successfully',
            completed: newCompleted === 1
          });
        }
      );
    }
  );
});

module.exports = router;



