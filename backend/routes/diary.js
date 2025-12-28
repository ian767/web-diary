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

// Get diary entries with filters (daily, weekly, monthly, yearly)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { view, date, startDate, endDate, mood, weather, tags } = req.query;
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
    const { date, title, content, mood, weather, tags, customFilenames, visibility } = req.body;
    const userId = req.user.id;
    const pool = database.getPool();

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

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

    // Insert diary entry
    const entryResult = await pool.query(
      'INSERT INTO diary_entries (user_id, date, title, content, mood, weather, tags, visibility, share_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [userId, date, title || null, content || null, mood || null, weather || null, tags || null, visibility || 'private', shareId]
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
    const { date, title, content, mood, weather, tags, deletedAttachments, renamedAttachments, visibility, customFilenames } = req.body;
    const userId = req.user.id;
    const pool = database.getPool();

    // Parse custom filenames if provided
    let customFilenamesMap = {};
    if (customFilenames) {
      try {
        customFilenamesMap = JSON.parse(customFilenames);
      } catch (e) {
        console.warn('Error parsing customFilenames:', e);
      }
    }

    // Update diary entry
    let updateQuery = 'UPDATE diary_entries SET date = $1, title = $2, content = $3, mood = $4, weather = $5, tags = $6, updated_at = CURRENT_TIMESTAMP';
    const updateParams = [date, title, content, mood || null, weather || null, tags || null];
    let paramIndex = 7;

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

module.exports = router;
