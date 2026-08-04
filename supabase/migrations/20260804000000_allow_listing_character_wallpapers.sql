-- The launch screen picks a random character wallpaper to sit behind the logo.
-- The bucket is public, so the objects were already fetchable by URL, but
-- listing them needs a SELECT policy on storage.objects — without one the app
-- cannot discover what is in there and the carousel has nothing to show.
--
-- Mirrors "characters are listable" exactly. Read-only, and the bucket holds
-- artwork rather than anything belonging to a user. No write policy is added,
-- so uploads and deletes stay closed to anon and authenticated alike, which
-- the RLS audit asserts for the characters bucket already.
create policy "character wallpapers are listable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'character wallpapers');
