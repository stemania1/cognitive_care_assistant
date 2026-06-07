-- Direct messaging: contacts list + recipient on each message.

CREATE TABLE IF NOT EXISTS messenger_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  contact_user_id TEXT NOT NULL,
  contact_display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_user_id, contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_messenger_contacts_owner ON messenger_contacts(owner_user_id);

ALTER TABLE messenger_contacts ENABLE ROW LEVEL SECURITY;

ALTER TABLE messenger_messages
  ADD COLUMN IF NOT EXISTS recipient_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_messenger_messages_thread
  ON messenger_messages(user_id, recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messenger_messages_recipient
  ON messenger_messages(recipient_user_id, created_at DESC);
