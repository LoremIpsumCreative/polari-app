-- Hardening pass following a black-box RLS audit (npm run rls:audit).
--
-- The audit proved the per-user tables are sound: with two real signed-in users
-- driving the public anon key, no cross-tenant read, write, delete or forged
-- insert was possible on profiles, user_streaks, favourites, quiz_attempts,
-- quiz_stats or user_word_progress. Three real holes were in `feedback`, plus
-- two defence-in-depth gaps. This fixes all five.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. feedback: attribution forgery
--
-- The old policy was `with check (true)` for anon + authenticated. Because the
-- table carries a nullable user_id, anyone holding the anon key — which ships
-- in the app bundle and is public by design — could post feedback stamped with
-- somebody else's user id. The audit confirmed it: an anonymous client wrote a
-- row attributed to a real account.
--
-- Anonymous feedback is a legitimate flow (the app sends
-- `user_id: session?.user.id ?? null`), so the fix is not "require auth" — it
-- is "you may claim nobody, or yourself, and no one else".
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "feedback is insertable by anyone" on public.feedback;

create policy "feedback is insertable, attributed honestly"
  on public.feedback
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- feedback stays write-only: no select/update/delete policy exists, so the
-- table cannot be read or altered through the API by anyone. Confirmed by the
-- audit for both anon and a signed-in user.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. feedback: unbounded payloads
--
-- The audit pushed a 500KB message through. Nothing bounded row size, so the
-- table was an open write channel for arbitrary volume.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.feedback
  add constraint feedback_message_len
    check (char_length(message) between 1 and 4000),
  add constraint feedback_contact_email_len
    check (contact_email is null or char_length(contact_email) <= 254),
  add constraint feedback_category_valid
    check (category is null or category in ('bug', 'word', 'general')),
  add constraint feedback_app_version_len
    check (app_version is null or char_length(app_version) <= 32);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. feedback: no rate limit
--
-- 20 out of 20 rapid anonymous inserts were accepted. Anonymous callers cannot
-- be identified at the database level, so the only lever here is a global cap.
--
-- TRADE-OFF, stated plainly: a global cap means a determined attacker can fill
-- the hour's quota and suppress genuine anonymous feedback until it rolls over.
-- That is accepted deliberately — losing an hour of an optional feedback form
-- is a far smaller harm than unbounded writes into the table. 200/hour is
-- orders of magnitude above real usage (this table held one row at the time of
-- writing), so it should never bind in practice. Signed-in users are capped per
-- account instead, which carries no such collateral.
--
-- Proper edge rate limiting (gateway / Turnstile on the form) is the better
-- long-term control; this is the backstop, not the strategy.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.feedback_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  if new.user_id is null then
    select count(*) into recent
      from public.feedback
     where user_id is null and created_at > now() - interval '1 hour';
    if recent >= 200 then
      raise exception 'feedback rate limit reached, please try again later'
        using errcode = '53400';
    end if;
  else
    select count(*) into recent
      from public.feedback
     where user_id = new.user_id and created_at > now() - interval '1 hour';
    if recent >= 20 then
      raise exception 'feedback rate limit reached, please try again later'
        using errcode = '53400';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.feedback_rate_limit() from public, anon, authenticated;

drop trigger if exists feedback_rate_limit_trigger on public.feedback;
create trigger feedback_rate_limit_trigger
  before insert on public.feedback
  for each row execute function public.feedback_rate_limit();

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SECURITY DEFINER functions were executable by anon
--
-- Migration 20260703000001 already revoked these — and the revoke did not
-- survive. `create or replace function` resets the default grant, which hands
-- EXECUTE back to PUBLIC, so every later redefinition silently reopened them.
--
-- Both functions do guard themselves (`if uid is null then raise exception`),
-- which is why the audit found no escalation. This closes the door anyway, so
-- the guard is the second line rather than the only one.
--
-- IF YOU EVER REDEFINE THESE, RE-RUN THESE GRANTS IN THE SAME MIGRATION.
-- ─────────────────────────────────────────────────────────────────────────────
revoke execute on function public.record_daily_engagement() from public, anon;
grant execute on function public.record_daily_engagement() to authenticated;

revoke execute on function public.record_quiz_game(text, integer, integer) from public, anon;
grant execute on function public.record_quiz_game(text, integer, integer) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. quiz_stats policies targeted `public` rather than `authenticated`
--
-- Functionally these held — anon has a null auth.uid(), and `null = user_id` is
-- null, not true, so anonymous access already failed closed. But relying on
-- null semantics to enforce a security boundary is fragile; say what is meant.
-- The UPDATE policy also had no with_check, which Postgres fills in from using;
-- spelling it out stops a later edit from quietly widening it.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "own quiz stats: select" on public.quiz_stats;
drop policy if exists "own quiz stats: upsert" on public.quiz_stats;
drop policy if exists "own quiz stats: update" on public.quiz_stats;

create policy "own quiz stats: select" on public.quiz_stats
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "own quiz stats: upsert" on public.quiz_stats
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "own quiz stats: update" on public.quiz_stats
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
