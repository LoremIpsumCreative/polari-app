-- When a signed-in reader acknowledged the content advisory.
--
-- Server-side rather than on the device, because the rule is "once per
-- account": someone who has read it on their phone should not be shown it
-- again on the web. A signed-out reader sees it every cold start and needs no
-- storage at all, which is why there is no anonymous equivalent here.
alter table public.profiles
  add column if not exists content_advisory_ack_at timestamptz;

comment on column public.profiles.content_advisory_ack_at is
  'When this account acknowledged the content advisory. Null means show it.';

-- The app writes this itself, so the owner needs update rights. Guarded rather
-- than assumed: profiles predates this migration and may already carry a
-- suitable policy under a different name.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and cmd = 'UPDATE'
  ) then
    create policy "profiles are updatable by their owner"
      on public.profiles
      for update
      to authenticated
      using ((select auth.uid()) = id)
      with check ((select auth.uid()) = id);
  end if;
end $$;
