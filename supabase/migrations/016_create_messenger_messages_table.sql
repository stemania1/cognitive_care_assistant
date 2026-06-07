-- Community messenger for dashboard users (Clerk auth enforced in Next.js API routes).

CREATE TABLE IF NOT EXISTS messenger_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'casual' CHECK (message_type IN ('urgent', 'casual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messenger_messages_created ON messenger_messages(created_at DESC);

-- RLS on with no anon/authenticated policies: blocks direct PostgREST access from the
-- browser. Next.js API routes use the service role key (bypasses RLS) + Clerk auth.
ALTER TABLE messenger_messages ENABLE ROW LEVEL SECURITY;
