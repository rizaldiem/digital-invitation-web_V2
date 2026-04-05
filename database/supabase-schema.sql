-- =============================================
-- Wedding Admin System - Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create 'wedding_config' table for configurable content
CREATE TABLE wedding_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  display_order INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'guests' table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  category TEXT DEFAULT 'family',
  rsvp_status TEXT DEFAULT 'pending',
  pax INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'wishes' table
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on all tables
ALTER TABLE wedding_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Public can INSERT wishes
CREATE POLICY "Public can insert wishes" ON wishes
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 6. RLS Policy: Public can SELECT guests
CREATE POLICY "Public can view guests" ON guests
FOR SELECT TO anon, authenticated
USING (true);

-- 7. RLS Policy: Public can UPDATE guests (RSVP)
CREATE POLICY "Public can update guests RSVP" ON guests
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 7a. RLS Policy: Public can INSERT guests (walk-in RSVP)
CREATE POLICY "Public can insert guests" ON guests
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 8. RLS Policy: Public can read wedding_config
CREATE POLICY "Public can view wedding config" ON wedding_config
FOR SELECT TO anon, authenticated
USING (true);

-- 9. RLS Policy: Anon users can update wedding_config
CREATE POLICY "Anon can update wedding config" ON wedding_config
FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can insert wedding config" ON wedding_config
FOR INSERT TO anon
WITH CHECK (true);

-- 10. Create indexes
CREATE INDEX idx_guests_slug ON guests(slug);
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);

-- Add phone column if not exists (for existing databases)
ALTER TABLE guests ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'family';

-- =============================================
-- Sample Guest Data
-- =============================================
INSERT INTO guests (name, slug, phone, category, rsvp_status, pax) VALUES
('John Doe', 'john-doe-x7k2p', '+628123456789', 'family', 'pending', 2),
('Jane Smith', 'jane-smith-m9n3q', '+628987654321', 'friends', 'pending', 1),
('Bob Wilson', 'bob-wilson-k8l4r', '', 'colleagues', 'pending', 1),
('Alice Brown', 'alice-brown-v2w5s', '+628111222333', 'vip', 'pending', 3);

-- =============================================
-- Gallery Table
-- =============================================
CREATE TABLE gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on gallery
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Gallery RLS Policies
CREATE POLICY "Public can view gallery" ON gallery
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can insert gallery" ON gallery
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can update gallery" ON gallery
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete gallery" ON gallery
FOR DELETE TO anon, authenticated USING (true);

-- =============================================
-- Gift Accounts Table (Amplop Digital)
-- =============================================
CREATE TABLE gift_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on gift_accounts
ALTER TABLE gift_accounts ENABLE ROW LEVEL SECURITY;

-- Gift Accounts RLS Policies
CREATE POLICY "Public can view gift_accounts" ON gift_accounts
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can insert gift_accounts" ON gift_accounts
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can update gift_accounts" ON gift_accounts
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete gift_accounts" ON gift_accounts
FOR DELETE TO anon, authenticated USING (true);

-- =============================================
-- Storage Buckets
-- =============================================
-- Wedding Assets Bucket (for bride/groom photos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wedding-assets', 'wedding-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Wedding Gallery Bucket (for gallery photos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wedding-gallery', 'wedding-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for wedding-assets
CREATE POLICY "Public can view wedding-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'wedding-assets');

CREATE POLICY "Public can upload wedding-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wedding-assets');

CREATE POLICY "Public can delete wedding-assets" ON storage.objects
FOR DELETE USING (bucket_id = 'wedding-assets');

-- Storage Policies for wedding-gallery
CREATE POLICY "Public can view wedding-gallery" ON storage.objects
FOR SELECT USING (bucket_id = 'wedding-gallery');

CREATE POLICY "Public can upload wedding-gallery" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wedding-gallery');

CREATE POLICY "Public can delete wedding-gallery" ON storage.objects
FOR DELETE USING (bucket_id = 'wedding-gallery');

-- =============================================
-- Default Wedding Configuration
-- =============================================
INSERT INTO wedding_config (key, value) VALUES
-- Couple Info
('bride_name', 'Flara Patricia'),
('bride_parents', 'Bapak Nama Bapak & Ibu Nama Ibu'),
('bride_instagram', '@flarapatricia'),
('groom_name', 'Kelvin Gunawan'),
('groom_parents', 'Bapak Nama Bapak & Ibu Nama Ibu'),
('groom_instagram', '@kelvingunawan'),
-- Wedding Date & Time
('wedding_date', '2024-09-23'),
('ceremony_time', '08:00 - 10.00 WIB'),
('reception_time', '11:00 - 14:00 WIB'),
-- Venue
('venue_name', 'Vue Palace Hotel'),
('venue_address', 'Jl. Otto Iskandar Dinata No.3, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung'),
('venue_maps_url', 'https://maps.google.com/?q=Vue+Palace+Hotel+Bandung'),
-- Love Story
('story_meet', 'September 2021||Awal Bertemu||Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
('story_relationship', 'September 2022||Menjalin Hubungan||Vestibulum morbi blandit cursus risus.'),
('story_engagement', 'September 2023||Bertunangan||Arcu vitae elementum curabitur vitae nunc sed.'),
('story_wedding', 'September 2024||Hari Pernikahan||Augue lacus viverra vitae congue eu consequat.'),
-- Quote
('quote', 'Dan di antara tanda-tanda kebesaran-Nya adalah Dia menciptakan untukmu pasangan dari jenismu sendiri supaya kamu mendapat ketenangan dari-Nya...'),
('quote_source', 'QS. Ar-Rum: 21'),
-- Section Toggles
('section_venue', 'true', 7),
('section_hero', 'true', 1),
('section_couple', 'true', 2),
('section_story', 'true', 3),
('section_gallery', 'true', 4),
('section_rsvp', 'true', 5),
('section_gift', 'true', 6),
('section_music', 'true', 0),
-- Domain
('wedding_domain', 'https://your-wedding-domain.com'),
-- Background Music
('bg_music_url', '');

-- =============================================
-- Migration: Add display_order for existing databases
-- Run this if the column doesn't exist or values are null
-- =============================================
ALTER TABLE wedding_config ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Update section display_order values if null
UPDATE wedding_config SET display_order = 7 WHERE key = 'section_venue' AND display_order IS NULL;
UPDATE wedding_config SET display_order = 1 WHERE key = 'section_hero' AND display_order IS NULL;
UPDATE wedding_config SET display_order = 2 WHERE key = 'section_couple' AND display_order IS NULL;
UPDATE wedding_config SET display_order = 3 WHERE key = 'section_story' AND display_order IS NULL;
UPDATE wedding_config SET display_order = 4 WHERE key = 'section_gallery' AND display_order IS NULL;
UPDATE wedding_config SET display_order = 5 WHERE key = 'section_rsvp' AND display_order IS NULL;
UPDATE wedding_config SET display_order = 6 WHERE key = 'section_gift' AND display_order IS NULL;
UPDATE wedding_config SET display_order = 0 WHERE key = 'section_music' AND display_order IS NULL;

-- Insert section_venue if not exists
INSERT INTO wedding_config (key, value, display_order) 
SELECT 'section_venue', 'true', 7 
WHERE NOT EXISTS (SELECT 1 FROM wedding_config WHERE key = 'section_venue');

-- Add animation toggle setting
INSERT INTO wedding_config (key, value) 
VALUES ('animations_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- Invite Opens Tracking
-- =============================================
CREATE TABLE IF NOT EXISTS invite_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_opens_slug ON invite_opens(slug);

ALTER TABLE invite_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert invite_opens" ON invite_opens
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- =============================================
-- WhatsApp Message Template Variations
-- =============================================
INSERT INTO wedding_config (key, value) 
VALUES ('whatsapp_template_variations', '[
  {
    "id": "v1",
    "text": "Kepada Yth. {{guest_name}}\n\nDengan penuh kebahagiaan kami mengundang Anda untuk menghadiri pernikahan {{bride_name}} & {{groom_name}}.\n\n📅 {{wedding_date}}\n📍 {{venue_name}}\n\nBuka undangan: {{invite_link}}\n\nHormat kami,\n{{bride_name}} & {{groom_name}}"
  },
  {
    "id": "v2", 
    "text": "Yth. {{guest_name}}\n\nMerupakan kebahagiaan bagi kami mengundang Anda di acara pernikahan {{bride_name}} & {{groom_name}}.\n\n🗓️ {{wedding_date}}\n🏠 {{venue_name}}\n\nSilakan klik: {{invite_link}}\n\nTerima kasih atas doa restunya.\n{{bride_name}} & {{groom_name}}"
  },
  {
    "id": "v3",
    "text": "Assalamu''alaikum Wr. Wb.\n\nDengan hormat,\nKami ingin mengundang {{guest_name}} menghadiri acara pernikahan {{bride_name}} & {{groom_name}}.\n\n📆 {{wedding_date}}\n📍 {{venue_name}}\n\n{{invite_link}}\n\nWassalamu''alaikum Wr. Wb.\n{{bride_name}} & {{groom_name}}"
  },
  {
    "id": "v4",
    "text": "Halo {{guest_name}}!\n\nKami sedang mempersiapkan hari special kami dan ingin mengundangmu ke pernikahan {{bride_name}} & {{groom_name}}!\n\n📅 {{wedding_date}}\n📍 {{venue_name}}\n\nJangan lupa datang ya! 💍\n{{invite_link}}"
  },
  {
    "id": "v5",
    "text": "Dear {{guest_name}},\n\nWith joy, we invite you to celebrate our wedding day!\n\n📅 {{wedding_date}}\n📍 {{venue_name}}\n\nOpen invitation: {{invite_link}}\n\nLooking forward to see you!\n{{bride_name}} & {{groom_name}}"
  }
]')
ON CONFLICT (key) DO NOTHING;
