-- Phase 2: Full-Text Search Migration
-- This migration adds full-text search capabilities to diary_entries table
-- Run this manually if needed, or it will be applied automatically on server start

-- Step 1: Ensure content_text is populated from content_html for old entries
-- (This is handled automatically in database.js addMissingColumns)

-- Step 2: Add tsvector column for full-text search
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Step 3: Create function to update search_vector
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

-- Step 4: Create trigger to automatically update search_vector
DROP TRIGGER IF EXISTS diary_entries_search_vector_trigger ON diary_entries;
CREATE TRIGGER diary_entries_search_vector_trigger
BEFORE INSERT OR UPDATE ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION diary_entries_search_vector_update();

-- Step 5: Populate search_vector for existing entries
UPDATE diary_entries
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(content_text, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(tags, '')), 'C');

-- Step 6: Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_diary_search_vector 
ON diary_entries USING GIN(search_vector);

-- Notes:
-- - Uses 'english' text search configuration (supports stemming, stop words)
-- - Title has weight 'A' (highest), content_text has weight 'B', tags have weight 'C'
-- - websearch_to_tsquery is used for user-friendly search (Postgres 11+)
-- - For older Postgres versions, use plainto_tsquery instead


