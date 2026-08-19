-- Close the moderation functions to the API.
--
-- The previous migration revoked EXECUTE from PUBLIC, which is not enough on
-- Supabase: creating a function also grants EXECUTE to `anon`, `authenticated`
-- and `service_role` explicitly, and revoking from PUBLIC leaves those alone.
-- The database linter caught it (0028/0029), and it matters here more than
-- usual:
--
--   check_display_name is the dictionary's oracle. Leaving it callable at
--   /rest/v1/rpc/check_display_name means anyone can probe it one string at a
--   time and rebuild the term list — which is precisely what withholding an RLS
--   policy on moderation_terms was meant to prevent. Closing the table and
--   leaving the question-answering function open protects nothing.
--
-- Nothing in the app calls these. Display names are written straight to
-- profiles and the BEFORE trigger does the checking, and a trigger function
-- runs as the table owner regardless of who may EXECUTE it — so revoking from
-- every API role costs no behaviour at all.

revoke all on function check_display_name(text) from public, anon, authenticated;
revoke all on function normalise_display_name(text) from public, anon, authenticated;
revoke all on function profiles_guard_display_name() from public, anon, authenticated;
