-- Give chat_sessions.id a default, like messages.id already has.
--
-- The frontend's "New chat" inserted a row with only user_id, and with no
-- default for id the insert failed (null value in a primary key column).
-- The frontend now sends its own id as well; this default makes any insert
-- without one work too.
--
-- Safe to run more than once.

alter table public.chat_sessions
    alter column id set default gen_random_uuid();
