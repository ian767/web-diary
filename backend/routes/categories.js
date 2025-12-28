const express = require('express');
const database = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all categories for the authenticated user
// GET /api/categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = database.getPool();

    const result = await pool.query(
      'SELECT id, name, created_at FROM categories WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// Create a new category
// POST /api/categories
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    const pool = database.getPool();

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category with same name already exists for this user
    const existingResult = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, name.trim()]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const result = await pool.query(
      'INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
      [userId, name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'Category with this name already exists' });
    }
    res.status(500).json({ error: 'Error creating category' });
  }
});

// Update a category (rename)
// PATCH /api/categories/:id
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;
    const pool = database.getPool();

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category exists and belongs to user
    const existingResult = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if another category with same name exists
    const duplicateResult = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
      [userId, name.trim(), id]
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name, created_at',
      [name.trim(), id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }
    res.status(500).json({ error: 'Error updating category' });
  }
});

// Delete a category
// DELETE /api/categories/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = database.getPool();

    // Check if category exists and belongs to user
    const existingResult = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is in use
    const inUseResult = await pool.query(
      'SELECT COUNT(*) as count FROM diary_entries WHERE category_id = $1',
      [id]
    );

    if (parseInt(inUseResult.rows[0].count, 10) > 0) {
      // Category is in use - set all entries' category_id to NULL instead of deleting
      await pool.query(
        'UPDATE diary_entries SET category_id = NULL WHERE category_id = $1',
        [id]
      );
    }

    // Delete the category
    await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Error deleting category' });
  }
});

module.exports = router;


