-- Add message type for urgent alerts vs everyday chat (existing installs).

ALTER TABLE messenger_messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'casual'
  CHECK (message_type IN ('urgent', 'casual'));

CREATE INDEX IF NOT EXISTS idx_messenger_messages_type_created
  ON messenger_messages(message_type, created_at DESC);
