const express = require('express');
const multer = require('multer');
const database = require('../database');
const storage = require('../storage');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Configure multer for in-memory storage (we'll upload to S3, not filesystem)
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory, then upload to S3
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(jpeg|jpg|png|gif|webp|pdf|txt|doc|docx)$/i;
    const extname = allowedTypes.test(file.originalname);
    
    // Check mimetype or extension
    const validMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (validMimeTypes.includes(file.mimetype) || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// Phase 2: Search diary entries (full-text search with filters)
// GET /api/diary/search?q=keyword&from=YYYY-MM-DD&to=YYYY-MM-DD&mood=happy&tags=tag1,tag2&limit=20&offset=0
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, from, to, mood, tags, favorite, category_id, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;
    const pool = database.getPool();

    // Build query with filters
    let query = 'SELECT id, date as entry_date, title, mood, tags, content_text, is_favorite, category_id FROM diary_entries WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    // Hybrid search: Full-text search + substring fallback (if q is provided)
    if (q && q.trim()) {
      const searchTerm = q.trim();
      
      // Strategy 1: Full-text search with prefix matching
      // Convert search term to prefix queries for better matching (e.g., "test" matches "test6")
      // Split into words and create prefix queries
      const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
      const prefixQueries = words.map(word => `${word}:*`).join(' & ');
      
      // Strategy 2: Substring matching (ILIKE) for exact matches like URLs
      // Combine both strategies with OR
      query += ` AND (
        search_vector @@ to_tsquery('english', $${paramIndex})
        OR title ILIKE $${paramIndex + 1}
        OR content_text ILIKE $${paramIndex + 1}
        OR tags ILIKE $${paramIndex + 1}
      )`;
      params.push(prefixQueries); // Prefix query for FTS
      params.push(`%${searchTerm}%`); // Substring pattern for ILIKE
      paramIndex += 2;
    }

    // Date range filter
    if (from) {
      query += ` AND date >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }
    if (to) {
      query += ` AND date <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }

    // Mood filter
    if (mood) {
      query += ` AND mood = $${paramIndex}`;
      params.push(mood);
      paramIndex++;
    }

    // Tags filter (comma-separated)
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      if (tagArray.length > 0) {
        // Check if any of the tags appear in the tags field
        query += ` AND (`;
        tagArray.forEach((tag, idx) => {
          if (idx > 0) query += ' OR ';
          query += `tags LIKE $${paramIndex}`;
          params.push(`%${tag}%`);
          paramIndex++;
        });
        query += `)`;
      }
    }

    // Phase 3A: Favorites filter
    if (favorite === 'true' || favorite === true || favorite === '1') {
      query += ` AND is_favorite = true`;
      console.log('Applied favorites filter: is_favorite = true');
    }

    // Phase 3A: Category filter
    if (category_id) {
      query += ` AND category_id = $${paramIndex}`;
      params.push(parseInt(category_id, 10));
      paramIndex++;
      console.log('Applied category filter: category_id =', category_id);
    }

    // Get total count (before pagination)
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Add ordering and pagination
    if (q && q.trim()) {
      const searchTerm = q.trim();
      const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
      const prefixQueries = words.map(word => `${word}:*`).join(' & ');
      const substringPattern = `%${searchTerm}%`;
      
      // Order by relevance (ts_rank) when searching, with fallback to date
      // Use CASE to prioritize exact substring matches
      query += ` ORDER BY 
        CASE 
          WHEN title ILIKE $${paramIndex - 1} THEN 1
          WHEN content_text ILIKE $${paramIndex - 1} THEN 2
          ELSE 3
        END,
        ts_rank(search_vector, to_tsquery('english', $${paramIndex - 2})) DESC, 
        date DESC`;
    } else {
      // Order by date when filtering only
      query += ` ORDER BY date DESC, created_at DESC`;
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const entriesResult = await pool.query(query, params);
    const entries = entriesResult.rows;

    // Generate snippets for each entry
    // Use ts_headline if available, otherwise substring
    const results = await Promise.all(entries.map(async (entry) => {
      let snippet = '';
      
      if (q && q.trim()) {
        const searchTerm = q.trim();
        // Use ts_headline to highlight search terms
        // Try with prefix query first, then fallback to exact term
        try {
          const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
          const prefixQueries = words.map(word => `${word}:*`).join(' & ');
          
          const headlineResult = await pool.query(`
            SELECT ts_headline('english', 
              COALESCE(title || ' ', '') || COALESCE(content_text, ''),
              to_tsquery('english', $1),
              'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15'
            ) as headline
          `, [prefixQueries]);
          snippet = headlineResult.rows[0]?.headline || '';
        } catch (err) {
          // Fallback if ts_headline fails
          console.warn('ts_headline failed, using substring:', err.message);
        }
        
        // If snippet is still empty, try substring highlighting
        if (!snippet && entry.content_text) {
          const lowerContent = entry.content_text.toLowerCase();
          const lowerSearch = searchTerm.toLowerCase();
          const index = lowerContent.indexOf(lowerSearch);
          if (index >= 0) {
            const start = Math.max(0, index - 40);
            const end = Math.min(entry.content_text.length, index + searchTerm.length + 40);
            let snippetText = entry.content_text.substring(start, end);
            if (start > 0) snippetText = '...' + snippetText;
            if (end < entry.content_text.length) snippetText = snippetText + '...';
            // Highlight the search term (escape special regex characters)
            const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            snippet = snippetText.replace(
              new RegExp(`(${escapedSearch})`, 'gi'),
              '<mark>$1</mark>'
            );
          }
        }
      }
      
      // Fallback to substring if no search query or ts_headline failed
      if (!snippet && entry.content_text) {
        snippet = entry.content_text.substring(0, 160);
        if (entry.content_text.length > 160) {
          snippet += '...';
        }
      } else if (!snippet && entry.title) {
        snippet = entry.title;
      }

      // Get attachment count
      const attachmentCountResult = await pool.query(
        'SELECT COUNT(*) as count FROM attachments WHERE diary_entry_id = $1',
        [entry.id]
      );
      const attachmentCount = parseInt(attachmentCountResult.rows[0].count, 10);

      return {
        id: entry.id,
        entry_date: entry.entry_date,
        title: entry.title,
        snippet: snippet.trim(),
        mood: entry.mood,
        tags: entry.tags,
        is_favorite: entry.is_favorite || false,
        category_id: entry.category_id || null,
        attachmentCount
      };
    }));

    res.json({
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      results
    });
  } catch (error) {
    console.error('Error searching diary entries:', error);
    res.status(500).json({ error: 'Error searching diary entries' });
  }
});

// Get diary entries with filters (daily, weekly, monthly, yearly)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { view, date, startDate, endDate, mood, weather, tags, favorite, category_id } = req.query;
    const userId = req.user.id;
    const pool = database.getPool();
    
    let query = 'SELECT * FROM diary_entries WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (view === 'daily' && date) {
      query += ` AND date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    } else if (view === 'weekly' && startDate && endDate) {
      query += ` AND date >= $${paramIndex} AND date <= $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    } else if (view === 'monthly' && date) {
      const year = date.substring(0, 4);
      const month = date.substring(5, 7);
      query += ` AND date::text LIKE $${paramIndex}`;
      params.push(`${year}-${month}-%`);
      paramIndex++;
    } else if (view === 'yearly' && date) {
      const year = date.substring(0, 4);
      query += ` AND date::text LIKE $${paramIndex}`;
      params.push(`${year}-%`);
      paramIndex++;
    }

    // Apply additional filters
    if (mood) {
      query += ` AND mood = $${paramIndex}`;
      params.push(mood);
      paramIndex++;
    }
    if (weather) {
      query += ` AND weather = $${paramIndex}`;
      params.push(weather);
      paramIndex++;
    }
    if (tags) {
      query += ` AND tags LIKE $${paramIndex}`;
      params.push(`%${tags}%`);
      paramIndex++;
    }
    
    // Phase 3A: Favorites filter
    if (favorite === 'true' || favorite === true || favorite === '1') {
      query += ` AND is_favorite = true`;
      console.log('Applied favorites filter: is_favorite = true');
    }
    
    // Phase 3A: Category filter
    if (category_id) {
      query += ` AND category_id = $${paramIndex}`;
      params.push(parseInt(category_id, 10));
      paramIndex++;
      console.log('Applied category filter: category_id =', category_id);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const entriesResult = await pool.query(query, params);
    const entries = entriesResult.rows;

    // Fetch attachments for each entry
    const entryIds = entries.map(e => e.id);
    if (entryIds.length === 0) {
      return res.json(entries);
    }

    const attachmentsResult = await pool.query(
      `SELECT * FROM attachments WHERE diary_entry_id = ANY($1)`,
      [entryIds]
    );
    const attachments = attachmentsResult.rows;

    // Group attachments by entry_id
    const attachmentsByEntry = {};
    attachments.forEach(att => {
      if (!attachmentsByEntry[att.diary_entry_id]) {
        attachmentsByEntry[att.diary_entry_id] = [];
      }
      attachmentsByEntry[att.diary_entry_id].push({
        ...att,
        url: att.file_url // Use file_url from database (S3 URL)
      });
    });

    // Attach attachments to entries
    entries.forEach(entry => {
      entry.attachments = attachmentsByEntry[entry.id] || [];
      // Phase 3A: Ensure is_favorite and category_id are included (default to false/null if not set)
      entry.is_favorite = entry.is_favorite || false;
      entry.category_id = entry.category_id || null;
    });

    res.json(entries);
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    res.status(500).json({ error: 'Error fetching diary entries' });
  }
});

// Get single diary entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = database.getPool();

    const entryResult = await pool.query(
      'SELECT * FROM diary_entries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Diary entry not found' });
    }

    const entry = entryResult.rows[0];

    // Fetch attachments
    const attachmentsResult = await pool.query(
      'SELECT * FROM attachments WHERE diary_entry_id = $1',
      [id]
    );
    const attachments = attachmentsResult.rows;

    entry.attachments = attachments.map(att => ({
      ...att,
      url: att.file_url // Use file_url from database (S3 URL)
    }));

    res.json(entry);
  } catch (error) {
    console.error('Error fetching diary entry:', error);
    res.status(500).json({ error: 'Error fetching diary entry' });
  }
});

// Create diary entry
router.post('/', authenticateToken, upload.array('attachments', 10), async (req, res) => {
  try {
    const { date, title, content, content_html, content_text, mood, weather, tags, customFilenames, visibility } = req.body;
    const userId = req.user.id;
    const pool = database.getPool();

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Phase 1: Prefer content_html/content_text, but support legacy content for backward compatibility
    const htmlContent = content_html || (content ? `<p>${content.replace(/\n/g, '</p><p>')}</p>` : null);
    const textContent = content_text || content || null;

    // Parse custom filenames if provided
    let customFilenamesMap = {};
    if (customFilenames) {
      try {
        customFilenamesMap = JSON.parse(customFilenames);
      } catch (e) {
        console.warn('Error parsing customFilenames:', e);
      }
    }

    // Generate share_id if visibility is public or unlisted
    let shareId = null;
    if (visibility === 'public' || visibility === 'unlisted') {
      shareId = crypto.randomBytes(16).toString('hex');
    }

    // Insert diary entry (Phase 1: support content_html/content_text)
    const entryResult = await pool.query(
      'INSERT INTO diary_entries (user_id, date, title, content, content_html, content_text, mood, weather, tags, visibility, share_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      [userId, date, title || null, content || null, htmlContent, textContent, mood || null, weather || null, tags || null, visibility || 'private', shareId]
    );

    const entryId = entryResult.rows[0].id;

    // Handle file uploads to S3
    const uploadErrors = [];
    const uploadedFiles = [];
    
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file, index) => {
        try {
          // Upload to S3
          const uploadResult = await storage.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype
          );

          // Use custom filename if provided
          const customName = customFilenamesMap[file.originalname] || file.originalname;

          // Store attachment record in database
          await pool.query(
            'INSERT INTO attachments (diary_entry_id, type, filename, original_filename, file_url, mime_type, size) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
              entryId,
              file.mimetype.startsWith('image/') ? 'photo' : 'article',
              uploadResult.key.split('/').pop(), // Extract filename from key
              customName,
              uploadResult.url, // Store S3 URL
              file.mimetype,
              file.size
            ]
          );
          
          uploadedFiles.push(file.originalname);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          const errorMessage = uploadError.message || 'Unknown upload error';
          uploadErrors.push({
            filename: file.originalname,
            error: errorMessage
          });
          // Continue with other files even if one fails
        }
      });

      await Promise.all(uploadPromises);
    }

    // Prepare response based on upload results
    if (uploadErrors.length > 0) {
      // Some or all uploads failed - return warning
      const response = {
        message: uploadErrors.length === req.files.length 
          ? 'Entry created but file uploads failed' 
          : 'Entry created but some file uploads failed',
        id: entryId,
        uploadedFiles: uploadedFiles.length,
        uploadErrors: uploadErrors
      };
      return res.status(207).json(response); // 207 Multi-Status for partial success
    }

    res.status(201).json({
      message: 'Diary entry created successfully',
      id: entryId,
      uploadedFiles: uploadedFiles.length
    });
  } catch (error) {
    console.error('Error creating diary entry:', error);
    res.status(500).json({ error: 'Error creating diary entry' });
  }
});

// Update diary entry
router.put('/:id', authenticateToken, upload.array('attachments', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { date, title, content, content_html, content_text, mood, weather, tags, deletedAttachments, renamedAttachments, visibility, customFilenames } = req.body;
    const userId = req.user.id;
    const pool = database.getPool();
    
    // Phase 1: Prefer content_html/content_text, but support legacy content for backward compatibility
    const htmlContent = content_html || (content ? `<p>${content.replace(/\n/g, '</p><p>')}</p>` : null);
    const textContent = content_text || content || null;

    // Parse custom filenames if provided
    let customFilenamesMap = {};
    if (customFilenames) {
      try {
        customFilenamesMap = JSON.parse(customFilenames);
      } catch (e) {
        console.warn('Error parsing customFilenames:', e);
      }
    }

    // Update diary entry (Phase 1: support content_html/content_text)
    let updateQuery = 'UPDATE diary_entries SET date = $1, title = $2, content = $3, content_html = $4, content_text = $5, mood = $6, weather = $7, tags = $8, updated_at = CURRENT_TIMESTAMP';
    const updateParams = [date, title, content || null, htmlContent, textContent, mood || null, weather || null, tags || null];
    let paramIndex = 9;

    // Update visibility if provided
    if (visibility !== undefined) {
      updateQuery += `, visibility = $${paramIndex}`;
      updateParams.push(visibility);
      paramIndex++;

      // Generate share_id if visibility is public or unlisted
      if (visibility === 'public' || visibility === 'unlisted') {
        // Check if entry already has a share_id
        const entryCheck = await pool.query('SELECT share_id FROM diary_entries WHERE id = $1', [id]);
        let shareId = entryCheck.rows[0]?.share_id;
        if (!shareId) {
          shareId = crypto.randomBytes(16).toString('hex');
          updateQuery += `, share_id = $${paramIndex}`;
          updateParams.push(shareId);
          paramIndex++;
        }
      } else {
        // Remove share_id if visibility is private
        updateQuery += `, share_id = $${paramIndex}`;
        updateParams.push(null);
        paramIndex++;
      }
    }

    updateQuery += ` WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`;
    updateParams.push(id, userId);

    const updateResult = await pool.query(updateQuery, updateParams);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Diary entry not found' });
    }

    // Handle deleted attachments
    if (deletedAttachments) {
      try {
        const deletedIds = JSON.parse(deletedAttachments);
        if (Array.isArray(deletedIds) && deletedIds.length > 0) {
          // Get file URLs to delete from S3
          const attachmentsResult = await pool.query(
            'SELECT file_url FROM attachments WHERE id = ANY($1) AND diary_entry_id = $2',
            [deletedIds, id]
          );

          // Delete files from S3 storage
          const deletePromises = attachmentsResult.rows.map(async (att) => {
            if (att.file_url) {
              try {
                await storage.deleteFile(att.file_url);
              } catch (deleteError) {
                console.error('Error deleting file from storage:', deleteError);
                // Continue even if deletion fails
              }
            }
          });

          await Promise.all(deletePromises);

          // Delete from database
          await pool.query(
            'DELETE FROM attachments WHERE id = ANY($1) AND diary_entry_id = $2',
            [deletedIds, id]
          );
        }
      } catch (parseErr) {
        console.error('Error parsing deletedAttachments:', parseErr);
      }
    }

    // Handle renamed attachments
    if (renamedAttachments) {
      try {
        const renamed = JSON.parse(renamedAttachments);
        if (Array.isArray(renamed) && renamed.length > 0) {
          const updatePromises = renamed.map(async (att) => {
            if (att.id && att.original_filename) {
              await pool.query(
                'UPDATE attachments SET original_filename = $1 WHERE id = $2 AND diary_entry_id = $3',
                [att.original_filename, att.id, id]
              );
            }
          });
          await Promise.all(updatePromises);
        }
      } catch (parseErr) {
        console.error('Error parsing renamedAttachments:', parseErr);
      }
    }

    // Handle new file uploads
    const uploadErrors = [];
    const uploadedFiles = [];
    
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        try {
          // Upload to S3
          const uploadResult = await storage.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype
          );

          // Use custom filename if provided
          const customName = customFilenamesMap[file.originalname] || file.originalname;

          // Store attachment record in database
          await pool.query(
            'INSERT INTO attachments (diary_entry_id, type, filename, original_filename, file_url, mime_type, size) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
              id,
              file.mimetype.startsWith('image/') ? 'photo' : 'article',
              uploadResult.key.split('/').pop(),
              customName,
              uploadResult.url,
              file.mimetype,
              file.size
            ]
          );
          
          uploadedFiles.push(file.originalname);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          const errorMessage = uploadError.message || 'Unknown upload error';
          uploadErrors.push({
            filename: file.originalname,
            error: errorMessage
          });
          // Continue with other files even if one fails
        }
      });

      await Promise.all(uploadPromises);
    }

    // Prepare response based on upload results
    if (uploadErrors.length > 0) {
      const response = {
        message: uploadErrors.length === req.files.length 
          ? 'Entry updated but file uploads failed' 
          : 'Entry updated but some file uploads failed',
        uploadedFiles: uploadedFiles.length,
        uploadErrors: uploadErrors
      };
      return res.status(207).json(response); // 207 Multi-Status for partial success
    }

    res.json({ 
      message: 'Diary entry updated successfully',
      uploadedFiles: uploadedFiles.length
    });
  } catch (error) {
    console.error('Error updating diary entry:', error);
    res.status(500).json({ error: 'Error updating diary entry' });
  }
});

// Delete diary entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = database.getPool();

    // Get all attachments to delete from S3
    const attachmentsResult = await pool.query(
      'SELECT file_url FROM attachments WHERE diary_entry_id = $1',
      [id]
    );

    // Delete files from S3 storage
    const deletePromises = attachmentsResult.rows.map(async (att) => {
      if (att.file_url) {
        try {
          await storage.deleteFile(att.file_url);
        } catch (deleteError) {
          console.error('Error deleting file from storage:', deleteError);
          // Continue even if deletion fails
        }
      }
    });

    await Promise.all(deletePromises);

    // Delete entry (attachments will be cascade deleted)
    const deleteResult = await pool.query(
      'DELETE FROM diary_entries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Diary entry not found' });
    }

    res.json({ message: 'Diary entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    res.status(500).json({ error: 'Error deleting diary entry' });
  }
});

// Delete attachment
router.delete('/:id/attachments/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const userId = req.user.id;
    const pool = database.getPool();

    // Verify entry belongs to user
    const entryCheck = await pool.query(
      'SELECT id FROM diary_entries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Diary entry not found' });
    }

    // Get attachment to delete from S3
    const attachmentResult = await pool.query(
      'SELECT file_url FROM attachments WHERE id = $1 AND diary_entry_id = $2',
      [attachmentId, id]
    );

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete file from S3 storage
    const fileUrl = attachmentResult.rows[0].file_url;
    if (fileUrl) {
      try {
        await storage.deleteFile(fileUrl);
      } catch (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete attachment record
    await pool.query(
      'DELETE FROM attachments WHERE id = $1',
      [attachmentId]
    );

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Error deleting attachment' });
  }
});

// Phase 3A: Toggle favorite status
// PATCH /api/diary/:id/favorite
router.patch('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const pool = database.getPool();

    // Get current favorite status
    const currentResult = await pool.query(
      'SELECT is_favorite FROM diary_entries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const currentFavorite = currentResult.rows[0].is_favorite;
    const newFavorite = !currentFavorite;

    // Update favorite status
    await pool.query(
      'UPDATE diary_entries SET is_favorite = $1 WHERE id = $2 AND user_id = $3',
      [newFavorite, id, userId]
    );

    res.json({ 
      message: 'Favorite status updated',
      is_favorite: newFavorite
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Error toggling favorite' });
  }
});

// Phase 3A: Timeline endpoint
// GET /api/diary/timeline?limit=20&offset=0
router.get('/timeline', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;
    const pool = database.getPool();

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM diary_entries WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get entries with minimal fields, ordered by date (newest first)
    const entriesResult = await pool.query(
      `SELECT 
        id, 
        date as entry_date, 
        title, 
        mood, 
        tags, 
        is_favorite,
        category_id,
        content_text
      FROM diary_entries 
      WHERE user_id = $1 
      ORDER BY date DESC, created_at DESC 
      LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit, 10), parseInt(offset, 10)]
    );

    const entries = entriesResult.rows;

    // Generate snippets and get attachment counts
    const results = await Promise.all(entries.map(async (entry) => {
      // Generate snippet from content_text
      let snippet = '';
      if (entry.content_text) {
        snippet = entry.content_text.substring(0, 160);
        if (entry.content_text.length > 160) {
          snippet += '...';
        }
      } else if (entry.title) {
        snippet = entry.title;
      }

      // Get attachment count
      const attachmentCountResult = await pool.query(
        'SELECT COUNT(*) as count FROM attachments WHERE diary_entry_id = $1',
        [entry.id]
      );
      const attachmentCount = parseInt(attachmentCountResult.rows[0].count, 10);

      return {
        id: entry.id,
        entry_date: entry.entry_date,
        title: entry.title,
        snippet: snippet.trim(),
        mood: entry.mood,
        tags: entry.tags,
        is_favorite: entry.is_favorite || false,
        category_id: entry.category_id,
        attachmentCount
      };
    }));

    res.json({
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      results
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Error fetching timeline' });
  }
});

module.exports = router;
