const { Pool } = require('pg');
require('dotenv').config();

// Production: Use DATABASE_URL from environment (provided by Render, Supabase, etc.)
// Development: Falls back to local PostgreSQL if DATABASE_URL not set
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('Warning: DATABASE_URL not set. Database operations will fail.');
  console.warn('For production: Set DATABASE_URL environment variable');
  console.warn('For local development: DATABASE_URL=postgresql://user:pass@localhost:5432/webdiary');
}

class Database {
  constructor() {
    this.pool = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (!DATABASE_URL) {
        return reject(new Error('DATABASE_URL environment variable is required'));
      }

      this.pool = new Pool({
        connectionString: DATABASE_URL,
        // For production (e.g., Render, Supabase), SSL is required
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      this.pool.on('connect', () => {
        console.log('Connected to PostgreSQL database');
      });

      this.pool.on('error', (err) => {
        console.error('Unexpected database error:', err);
      });

      // Test connection and initialize tables
      this.pool.query('SELECT NOW()', (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          this.initializeTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async initializeTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Diary entries table
      // visibility: 'private' (default), 'unlisted', 'public'
      // share_id: unique identifier for public/unlisted entries
      await client.query(`
        CREATE TABLE IF NOT EXISTS diary_entries (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          title TEXT,
          content TEXT,
          mood TEXT,
          weather TEXT,
          tags TEXT,
          visibility VARCHAR(20) DEFAULT 'private',
          share_id VARCHAR(255) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Tasks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          diary_entry_id INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          due_date DATE,
          completed BOOLEAN DEFAULT false,
          priority VARCHAR(20) DEFAULT 'medium',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (diary_entry_id) REFERENCES diary_entries(id) ON DELETE SET NULL
        )
      `);

      // Attachments table
      // file_url: stores the public URL from S3-compatible storage (not filesystem path)
      await client.query(`
        CREATE TABLE IF NOT EXISTS attachments (
          id SERIAL PRIMARY KEY,
          diary_entry_id INTEGER NOT NULL,
          type VARCHAR(50) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          file_url TEXT NOT NULL,
          mime_type VARCHAR(100),
          size INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (diary_entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, date)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_diary_share_id ON diary_entries(share_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_entry ON tasks(diary_entry_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_attachments_entry ON attachments(diary_entry_id)
      `);

      // Add missing columns if they don't exist (for migrations from SQLite)
      await this.addMissingColumns(client);

      // Phase 2: Add full-text search indexing
      await this.setupFullTextSearch(client);

      // Phase 3A: Create categories table
      await this.createCategoriesTable(client);

      // Phase 3A: Add organization fields (is_favorite, category_id)
      await this.addOrganizationFields(client);

      await client.query('COMMIT');
      console.log('Database tables initialized successfully');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error initializing tables:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async addMissingColumns(client) {
    try {
      // Check and add visibility column if missing
      const visibilityCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='diary_entries' AND column_name='visibility'
      `);
      if (visibilityCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE diary_entries ADD COLUMN visibility VARCHAR(20) DEFAULT 'private'
        `);
        console.log('Added visibility column to diary_entries');
      }

      // Check and add share_id column if missing
      const shareIdCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='diary_entries' AND column_name='share_id'
      `);
      if (shareIdCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE diary_entries ADD COLUMN share_id VARCHAR(255) UNIQUE
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_diary_share_id ON diary_entries(share_id)
        `);
        console.log('Added share_id column to diary_entries');
      }

      // Check if attachments table has file_url (for migration from file_path)
      const fileUrlCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='attachments' AND column_name='file_url'
      `);
      if (fileUrlCheck.rows.length === 0) {
        // Check if old file_path column exists
        const filePathCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='attachments' AND column_name='file_path'
        `);
        if (filePathCheck.rows.length > 0) {
          // Migration: Add file_url column
          await client.query(`
            ALTER TABLE attachments ADD COLUMN file_url TEXT
          `);
          // Note: Existing file_path values would need to be migrated manually
          // This is a placeholder for the migration logic
          console.log('Added file_url column to attachments (migration needed)');
        } else {
          // New installation - file_url is already in CREATE TABLE
        }
      }

      // Check and add content_html column if missing (Phase 1: Rich text editor)
      const contentHtmlCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='diary_entries' AND column_name='content_html'
      `);
      if (contentHtmlCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS content_html TEXT
        `);
        console.log('Added content_html column to diary_entries');
      }

      // Check and add content_text column if missing (Phase 1: Rich text editor)
      const contentTextCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='diary_entries' AND column_name='content_text'
      `);
      if (contentTextCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS content_text TEXT
        `);
        console.log('Added content_text column to diary_entries');
      }

      // Phase 2: Populate content_text from content_html for old entries
      // This migration runs once to backfill content_text for entries that only have content_html
      const needsMigration = await client.query(`
        SELECT COUNT(*) as count
        FROM diary_entries
        WHERE (content_text IS NULL OR content_text = '')
        AND (content_html IS NOT NULL AND content_html != '')
      `);
      if (needsMigration.rows[0].count > 0) {
        console.log(`Migrating ${needsMigration.rows[0].count} entries: populating content_text from content_html...`);
        // Strip HTML tags to create plain text (simple regex-based approach)
        // Note: This is a basic migration. For production, consider using a proper HTML parser.
        await client.query(`
          UPDATE diary_entries
          SET content_text = regexp_replace(
            regexp_replace(content_html, '<[^>]+>', '', 'g'),
            '\\s+', ' ', 'g'
          )
          WHERE (content_text IS NULL OR content_text = '')
          AND (content_html IS NOT NULL AND content_html != '')
        `);
        console.log('Migration complete: content_text populated from content_html');
      }
    } catch (err) {
      console.warn('Warning during column migration:', err.message);
      // Don't fail initialization if migration fails
    }
  }

  /**
   * Phase 2: Setup full-text search indexing
   * Creates a tsvector column and GIN index for fast full-text search
   */
  async setupFullTextSearch(client) {
    try {
      // Check if search_vector column exists
      const searchVectorCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='diary_entries' AND column_name='search_vector'
      `);

      if (searchVectorCheck.rows.length === 0) {
        // Add tsvector column for full-text search
        // Combines title, content_text, and tags for search
        await client.query(`
          ALTER TABLE diary_entries 
          ADD COLUMN search_vector tsvector
        `);
        console.log('Added search_vector column to diary_entries');

        // Create a function to update search_vector (using 'english' text search configuration)
        await client.query(`
          CREATE OR REPLACE FUNCTION diary_entries_search_vector_update()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.search_vector := 
              setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
              setweight(to_tsvector('english', COALESCE(NEW.content_text, '')), 'B') ||
              setweight(to_tsvector('english', COALESCE(NEW.tags, '')), 'C');
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);

        // Create trigger to automatically update search_vector on insert/update
        await client.query(`
          CREATE TRIGGER diary_entries_search_vector_trigger
          BEFORE INSERT OR UPDATE ON diary_entries
          FOR EACH ROW
          EXECUTE FUNCTION diary_entries_search_vector_update()
        `);
        console.log('Created search_vector trigger');

        // Populate search_vector for existing entries
        await client.query(`
          UPDATE diary_entries
          SET search_vector = 
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(content_text, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(tags, '')), 'C')
        `);
        console.log('Populated search_vector for existing entries');

        // Create GIN index for fast full-text search
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_diary_search_vector 
          ON diary_entries USING GIN(search_vector)
        `);
        console.log('Created GIN index for search_vector');
      }
    } catch (err) {
      console.warn('Warning during full-text search setup:', err.message);
      // Don't fail initialization if search setup fails
    }
  }

  /**
   * Phase 3A: Create categories table
   * Creates a categories table for organizing diary entries by user
   */
  async createCategoriesTable(client) {
    try {
      // Create categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, name)
        )
      `);

      // Create index for user_id for faster lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)
      `);

      console.log('Categories table created successfully');
    } catch (err) {
      console.warn('Warning during categories table creation:', err.message);
      // Don't fail initialization if categories setup fails
    }
  }

  /**
   * Phase 3A: Add organization fields to diary_entries
   * Adds is_favorite (boolean) and category_id (nullable FK) columns
   */
  async addOrganizationFields(client) {
    try {
      // Check and add is_favorite column if missing
      const isFavoriteCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='diary_entries' AND column_name='is_favorite'
      `);
      if (isFavoriteCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE diary_entries 
          ADD COLUMN is_favorite BOOLEAN DEFAULT false
        `);
        console.log('Added is_favorite column to diary_entries');
      }

      // Check and add category_id column if missing
      const categoryIdCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='diary_entries' AND column_name='category_id'
      `);
      if (categoryIdCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE diary_entries 
          ADD COLUMN category_id INTEGER
        `);
        console.log('Added category_id column to diary_entries');
      }

      // Check and add foreign key constraint if missing
      const fkCheck = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name='diary_entries' AND constraint_name='fk_diary_category'
      `);
      if (fkCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE diary_entries 
          ADD CONSTRAINT fk_diary_category 
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        `);
        console.log('Added foreign key constraint for category_id');
      }

      // Create index for category_id for faster lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_diary_category_id ON diary_entries(category_id)
      `);

      // Create index for is_favorite for faster filtering
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_diary_is_favorite ON diary_entries(user_id, is_favorite)
      `);

      console.log('Organization fields added successfully');
    } catch (err) {
      console.warn('Warning during organization fields setup:', err.message);
      // Don't fail initialization if organization fields setup fails
    }
  }

  getPool() {
    return this.pool;
  }

  // Helper function to convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
  convertQuery(query) {
    if (!query.includes('?')) {
      return query; // Already PostgreSQL format or no parameters
    }
    
    let paramIndex = 1;
    return query.replace(/\?/g, () => `$${paramIndex++}`);
  }

  // Compatibility method for existing code that uses getDb()
  // Converts SQLite-style queries (?) to PostgreSQL format ($1, $2, etc.)
  getDb() {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    const self = this;
    
    // Return a wrapper that provides a similar interface to sqlite3
    return {
      all: (query, params, callback) => {
        const pgQuery = self.convertQuery(query);
        self.pool.query(pgQuery, params || [], (err, result) => {
          if (callback) {
            callback(err, err ? null : result.rows);
          }
        });
      },
      get: (query, params, callback) => {
        const pgQuery = self.convertQuery(query);
        self.pool.query(pgQuery, params || [], (err, result) => {
          if (callback) {
            callback(err, err ? null : (result.rows[0] || null));
          }
        });
      },
      run: function(query, params, callback) {
        const pgQuery = self.convertQuery(query);
        const context = { lastID: undefined, changes: 0 };
        
        self.pool.query(pgQuery, params || [], (err, result) => {
          if (err) {
            if (callback) {
              callback.call(context, err);
            }
            return;
          }
          
          // For INSERT queries with RETURNING, extract the ID
          if (result.rows && result.rows.length > 0 && result.rows[0].id) {
            context.lastID = result.rows[0].id;
          }
          context.changes = result.rowCount || 0;
          
          if (callback) {
            // Call callback with SQLite-style context binding (this.lastID, this.changes)
            callback.call(context, null, { lastID: context.lastID, changes: context.changes });
          }
        });
      },
      prepare: (query) => {
        const pgQuery = self.convertQuery(query);
        return {
          run: function(params, callback) {
            const context = { lastID: undefined, changes: 0 };
            self.pool.query(pgQuery, params || [], (err, result) => {
              if (err) {
                if (callback) {
                  callback.call(context, err);
                }
                return;
              }
              
              if (result.rows && result.rows.length > 0 && result.rows[0].id) {
                context.lastID = result.rows[0].id;
              }
              context.changes = result.rowCount || 0;
              
              if (callback) {
                callback.call(context, null, { lastID: context.lastID, changes: context.changes });
              }
            });
          },
          finalize: () => {
            // No-op for PostgreSQL
          }
        };
      }
    };
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = new Database();
