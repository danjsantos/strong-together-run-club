-- Migration: Add cover_photo_url to events
-- This adds the cover_photo_url column to the events table so admins can set a cover photo for each event in the gallery.
-- Using IF NOT EXISTS to be safe in case it was already added by a previous migration.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_photo_url text;
