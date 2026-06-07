-- Enable RLS on messenger_messages if the table was created with RLS disabled.
-- No policies are added: anon/authenticated cannot read or write via PostgREST.
-- Next.js API routes use the service role key (bypasses RLS) with Clerk auth checks.

ALTER TABLE messenger_messages ENABLE ROW LEVEL SECURITY;
