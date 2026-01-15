-- Migration: Update reading_progress and bookmarks tables for Reader persistence
-- Add chapterIndex and settings to reading_progress
ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS chapter_index integer;
ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS settings jsonb;

-- Update bookmarks table to match frontend interface
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS chapter_index integer;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS percentage numeric(5, 2);
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS selected_text text;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS page_in_chapter integer;

-- Migrate existing data from old columns to new columns
UPDATE bookmarks SET chapter_index = CAST(chapter_id AS integer)
WHERE chapter_id IS NOT NULL AND chapter_id ~ '^[0-9]+$' AND chapter_index IS NULL;

UPDATE bookmarks SET selected_text = content 
WHERE content IS NOT NULL AND selected_text IS NULL;

UPDATE bookmarks SET page_in_chapter = position 
WHERE position IS NOT NULL AND page_in_chapter IS NULL;

-- Drop old columns (only if they exist)
ALTER TABLE bookmarks DROP COLUMN IF EXISTS chapter_id;
ALTER TABLE bookmarks DROP COLUMN IF EXISTS content;
ALTER TABLE bookmarks DROP COLUMN IF EXISTS position;
