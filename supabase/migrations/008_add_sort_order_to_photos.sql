-- Add sort_order column to event_photos table
ALTER TABLE event_photos ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
