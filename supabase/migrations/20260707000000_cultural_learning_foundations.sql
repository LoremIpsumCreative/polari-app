-- Foundations for the cultural layer and learning features.
-- Additive and non-destructive: new nullable columns + new tables.

-- Cultural + learning fields on words
alter table public.words
  add column if not exists cultural_context text,
  add column if not exists usage_status text,      -- 'current' | 'rare' | 'historical'
  add column if not exists sensitivity_note text,
  add column if not exists register text,           -- e.g. 'camp', 'cant', 'slang'
  add column if not exists difficulty smallint,     -- 1..3
  add column if not exists related_slugs text[],
  add column if not exists audio_url text;

-- Themed collections (publicly readable, like words)
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  accent text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.collections enable row level security;
create policy "collections are publicly readable" on public.collections
  for select to anon, authenticated using (true);

create table if not exists public.collection_words (
  collection_id uuid not null references public.collections(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, word_id)
);
alter table public.collection_words enable row level security;
create policy "collection_words are publicly readable" on public.collection_words
  for select to anon, authenticated using (true);
create index if not exists collection_words_word_id_idx on public.collection_words(word_id);

-- Per-user word progress: spaced repetition + mastery (owner-scoped, like favourites)
create table if not exists public.user_word_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  mastery smallint not null default 0,       -- 0..5
  ease real not null default 2.5,
  reps integer not null default 0,
  lapses integer not null default 0,
  interval_days integer not null default 0,
  due_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, word_id)
);
alter table public.user_word_progress enable row level security;
create policy "word progress is managed by owner" on public.user_word_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists user_word_progress_due_idx on public.user_word_progress(user_id, due_at);
