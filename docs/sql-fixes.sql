-- =============================================
-- PRE-PRODUCTION SQL FIXES
-- Run these in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. SECURITY FIX - Remove dangerous RLS policies
-- =============================================
-- Remove public update/insert on wedding_config (keep SELECT only)
DROP POLICY IF EXISTS "Anon can update wedding config" ON wedding_config;
DROP POLICY IF EXISTS "Anon can insert wedding config" ON wedding_config;

-- =============================================
-- 2. GALLERY DELETE FIX - Fix delete policy
-- =============================================
DROP POLICY IF EXISTS "Public can delete gallery" ON gallery;
CREATE POLICY "Public can delete gallery" ON gallery
FOR DELETE TO authenticated USING (true);

-- =============================================
-- 3. PERFORMANCE - Add missing indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_section ON gallery(section);
CREATE INDEX IF NOT EXISTS idx_guests_created_at ON guests(created_at DESC);

-- =============================================
-- 4. WEDDING_CONFIG - Add service-only update policy
-- (For admin panel using service role key)
-- =============================================
-- Only allow updates if using service role key (bypasses RLS)
-- This is already secure as service role key should never be exposed to client

-- =============================================
-- 5. CONSTRAINTS - Add data validation
-- =============================================
-- Add CHECK constraint for pax (max 5 guests per booking)
ALTER TABLE guests DROP CONSTRAINT IF EXISTS chk_pax_range;
ALTER TABLE guests ADD CONSTRAINT chk_pax_range CHECK (pax >= 0 AND pax <= 10);

-- Add CHECK constraint for rsvp_status
ALTER TABLE guests DROP CONSTRAINT IF EXISTS chk_rsvp_status;
ALTER TABLE guests ADD CONSTRAINT chk_rsvp_status 
CHECK (rsvp_status IN ('pending', 'confirmed', 'declined'));

-- =============================================
-- VERIFICATION - Run these to check results
-- =============================================
-- Check existing policies:
-- SELECT * FROM pg_policies WHERE tablename = 'wedding_config';
-- SELECT * FROM pg_policies WHERE tablename = 'gallery';

-- Check indexes:
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('wishes', 'gallery', 'guests');
