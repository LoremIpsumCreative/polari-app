-- Polari dictionary (public, read-only reference data — writes only via seed script service role key)
create table words (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null unique,
  slug text not null unique,
  term text not null,
  entry_type text not null check (entry_type in ('word', 'phrase')),
  part_of_speech text,
  pronunciation text,
  definition text not null,
  origin text,
  example text,
  notes_variants text,
  search_text text generated always as (
    lower(term || ' ' || coalesce(definition, '') || ' ' || coalesce(notes_variants, ''))
  ) stored,
  created_at timestamptz not null default now()
);

alter table words enable row level security;

create policy "words are publicly readable"
  on words for select
  to anon, authenticated
  using (true);

-- One row per auth user, mirrors auth.users for app-facing profile data
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are readable by owner"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles are updatable by owner"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Streaks + words-learned counter, one row per user
create table user_streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  words_learned_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table user_streaks enable row level security;

create policy "user_streaks are readable by owner"
  on user_streaks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_streaks are updatable by owner"
  on user_streaks for update
  to authenticated
  using (auth.uid() = user_id);

-- Auto-provision profile + streak row whenever a new auth user is created
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Centralized, race-safe streak/words-learned mutation.
-- No-ops if already credited today; +1 if credited yesterday; resets to 1 otherwise.
create function public.record_daily_engagement()
returns table (current_streak integer, longest_streak integer, words_learned_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := current_date;
  rec public.user_streaks;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select * into rec from public.user_streaks where user_id = uid for update;

  if rec.last_active_date = today then
    -- already credited today, no-op
    null;
  elsif rec.last_active_date = today - 1 then
    update public.user_streaks
      set current_streak = rec.current_streak + 1,
          longest_streak = greatest(rec.longest_streak, rec.current_streak + 1),
          last_active_date = today,
          words_learned_count = rec.words_learned_count + 1,
          updated_at = now()
      where user_id = uid;
  else
    update public.user_streaks
      set current_streak = 1,
          longest_streak = greatest(rec.longest_streak, 1),
          last_active_date = today,
          words_learned_count = rec.words_learned_count + 1,
          updated_at = now()
      where user_id = uid;
  end if;

  return query
    select s.current_streak, s.longest_streak, s.words_learned_count
    from public.user_streaks s
    where s.user_id = uid;
end;
$$;

grant execute on function public.record_daily_engagement() to authenticated;

-- Favourited words, one row per (user, word)
create table favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references words (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, word_id)
);

alter table favourites enable row level security;

create policy "favourites are managed by owner"
  on favourites for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Quiz round history; high score is derived via max(score), not stored separately
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null,
  total_questions integer not null default 10,
  created_at timestamptz not null default now()
);

alter table quiz_attempts enable row level security;

create policy "quiz_attempts are insertable by owner"
  on quiz_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "quiz_attempts are readable by owner"
  on quiz_attempts for select
  to authenticated
  using (auth.uid() = user_id);

-- Write-only feedback inbox (read via Supabase Studio in v1, no client select policy)
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  category text,
  message text not null,
  contact_email text,
  app_version text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "feedback is insertable by anyone"
  on feedback for insert
  to anon, authenticated
  with check (true);
