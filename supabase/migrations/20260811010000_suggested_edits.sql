-- Suggested edits: a reader proposing a correction to one field of one word.
--
-- Its own table rather than a `feedback` category. A suggestion is structured —
-- it names a word and a field — where feedback is freeform prose, and the two
-- have different lifecycles: feedback is read, a suggestion is resolved by
-- editing the sheet. Mixing them would make both awkward to query.
--
-- The security model is copied deliberately from feedback as hardened in
-- 20260803000000, because this table is the same shape of risk: a public write
-- channel reachable with the anon key that ships in every bundle.
create table if not exists public.suggested_edits (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words(id) on delete cascade,
  -- The card row being corrected, stored as the DB column it refers to so a
  -- suggestion can be applied without a translation step.
  field text not null,
  suggestion text not null,
  -- Nullable, like feedback: a signed-out reader spotting a typo is exactly the
  -- person most worth hearing from, and requiring an account would lose them.
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Set by hand once the sheet has been updated; the review queue is
  -- "everything where this is null".
  resolved_at timestamptz
);

alter table public.suggested_edits enable row level security;

-- You may claim nobody, or yourself, and no one else. Anything looser lets
-- anyone holding the public anon key post a suggestion stamped with someone
-- else's account, which is the exact hole the feedback audit found.
create policy "suggested edits are insertable, attributed honestly"
  on public.suggested_edits
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- Deliberately write-only: no select/update/delete policy exists, so the table
-- cannot be read or altered through the API by anyone. Reviewing happens with
-- the service role, never the client.

-- Bound the payload. The feedback audit pushed 500KB through an unbounded
-- column; nothing here should be longer than the field it proposes to replace.
alter table public.suggested_edits
  add constraint suggested_edits_suggestion_len
    check (char_length(suggestion) between 1 and 2000),
  -- Only the rows the definition card actually shows can be suggested against.
  -- A bad value is a bug in the app, not something to store and puzzle over.
  add constraint suggested_edits_field_valid
    check (field in (
      'definition', 'example', 'origin', 'cultural_context', 'notes_variants', 'pronunciation'
    ));

-- The review queue reads unresolved rows newest-first; partial because resolved
-- ones are history and are never what you are looking for.
create index if not exists suggested_edits_open_idx
  on public.suggested_edits (created_at desc) where resolved_at is null;

comment on table public.suggested_edits is
  'Reader-proposed corrections to a single field of a single word. Write-only via the API; review with the service role.';
