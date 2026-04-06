-- Standalone photo album entries (drop-off uploads with category), separate from daily_checks.
-- Security: enforced in Next.js API routes with Clerk + service role (RLS disabled like other Clerk tables).

CREATE TABLE IF NOT EXISTS album_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_album_photos_user ON album_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_user_created ON album_photos(user_id, created_at DESC);

ALTER TABLE album_photos DISABLE ROW LEVEL SECURITY;
