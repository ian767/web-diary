const express = require('express');
const database = require('../database');
const crypto = require('crypto');

const router = express.Router();

/**
 * Public routes for shared diary entries (read-only)
 * These routes do NOT require authentication
 * 
 * Routes:
 * - GET /api/public/share/:shareId - Get a shared diary entry by shareId
 */

// Get shared diary entry by shareId (public access, no authentication required)
router.get('/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const pool = database.getPool();

    // Find entry by share_id and visibility (public or unlisted)
    const entryResult = await pool.query(
      'SELECT * FROM diary_entries WHERE share_id = $1 AND visibility IN ($2, $3)',
      [shareId, 'public', 'unlisted']
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shared entry not found or no longer available' });
    }

    const entry = entryResult.rows[0];

    // Fetch attachments
    const attachmentsResult = await pool.query(
      'SELECT id, type, original_filename, file_url, mime_type, size FROM attachments WHERE diary_entry_id = $1',
      [entry.id]
    );
    const attachments = attachmentsResult.rows;

    // Return entry with attachments (file_url already contains public S3 URL)
    entry.attachments = attachments.map(att => ({
      ...att,
      url: att.file_url // Use file_url from database (S3 URL)
    }));

    // Return read-only version (exclude sensitive fields if needed)
    res.json({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      weather: entry.weather,
      tags: entry.tags,
      attachments: entry.attachments,
      created_at: entry.created_at,
      updated_at: entry.updated_at
      // Note: Do not return user_id or other sensitive information
    });
  } catch (error) {
    console.error('Error fetching shared entry:', error);
    res.status(500).json({ error: 'Error fetching shared entry' });
  }
});

module.exports = router;


