-- Display-name moderation.
--
-- The dictionary lives here rather than in the app so a newly problematic term
-- can be added without waiting for an App Store release. The app ships only the
-- normaliser; the rules are data.
--
-- Enforcement is layered, and each layer exists for a different reason:
--   client   immediate feedback while typing            (UX)
--   RPC      the check the app actually calls           (shared logic)
--   trigger  runs on every write, whatever made it      (invariant)
--
-- The trigger is the one that matters for security: RLS lets a signed-in user
-- PATCH their own profiles row directly through PostgREST, so a validator that
-- only runs in the app is a suggestion, not a rule.

-- unaccent() strips diacritics. Postgres regex cannot express the combining-mark
-- class the TypeScript normaliser uses, so this extension is what keeps the two
-- implementations agreeing on what "café" normalises to.
create extension if not exists unaccent with schema extensions;

-- ── Rules ────────────────────────────────────────────────────────────────────

create type moderation_match_type as enum (
  'exact',            -- the whole name, normalised, is the term
  'whole_word',       -- the term appears as its own word
  'contains',         -- the term appears anywhere in the normalised form
  'compact_contains', -- ...or anywhere in the compact form (catches f.u.c.k)
  'prefix',
  'suffix'
);

create type moderation_category as enum (
  'profanity',
  'sexual',
  'slur',
  'extremism',
  'religion',
  'politics',
  'violence',
  'drugs',
  'impersonation',
  'reserved',
  'spam'
);

create table moderation_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  category moderation_category not null,
  match_type moderation_match_type not null default 'compact_contains',
  -- 'block' refuses the name. 'allow' is an explicit carve-out that wins over
  -- every blocking rule, which is how a false positive gets fixed in seconds
  -- without deleting the rule that caused it.
  severity text not null default 'block' check (severity in ('block', 'allow')),
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (term, match_type)
);

-- Phonetic and spelling deviations the normaliser cannot reach: it collapses
-- typography (f*ck), not spelling (phuck, fuq). Those belong on the rule.
create table moderation_aliases (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references moderation_terms (id) on delete cascade,
  alias text not null,
  unique (term_id, alias)
);

create index moderation_terms_enabled_idx on moderation_terms (enabled) where enabled;
create index moderation_aliases_term_idx on moderation_aliases (term_id);

alter table moderation_terms enable row level security;
alter table moderation_aliases enable row level security;

-- No policies, deliberately. The dictionary is not readable by the client: it
-- is a list of exactly which strings evade moderation, and handing that to the
-- app is handing over the answer key. The matching functions below are
-- security definer, so they read it on the caller's behalf without exposing it.

-- ── Normalisation, mirroring src/lib/nameModeration.ts ───────────────────────

create or replace function normalise_display_name(input text)
returns table (normalised text, compact text)
language plpgsql
-- stable, not immutable: unaccent() reads a dictionary, so it is itself only
-- stable. Declaring this immutable would be a promise the function cannot keep
-- and would let the planner cache results it should not.
stable
set search_path = public, extensions
as $$
declare
  v text;
begin
  v := lower(normalize(coalesce(input, ''), NFKC));
  -- Accents off. The TypeScript decomposes and drops combining marks, which
  -- Postgres cannot express — its regex engine is POSIX and has no \p{M} class,
  -- so that pattern is a hard error rather than a no-op. unaccent() is the
  -- equivalent here, and is why the extension is required above.
  v := extensions.unaccent(v);
  -- Invisible characters.
  v := regexp_replace(v, '[​-‍⁠﻿­]', '', 'g');

  -- Confusables, then leetspeak. Kept in the same order as the TypeScript.
  v := translate(v, 'аеорсхіѕԁαεορτυ', 'aeopcxisdaeoptu');
  v := translate(v, '0123456789@$€£¢¥', 'oizeasgtbgaselcy');

  normalised := btrim(regexp_replace(regexp_replace(v, '[._~*^|+\-,''"`•·]+', ' ', 'g'), '\s+', ' ', 'g'));

  compact := regexp_replace(translate(normalised, '!|+', 'iit'), '[^a-z0-9]', '', 'g');
  -- Collapse runs of three or more.
  compact := regexp_replace(compact, '(.)\1{2,}', '\1', 'g');

  return next;
end;
$$;

-- ── Matching ─────────────────────────────────────────────────────────────────

-- Returns the rule that rejects this name, or nothing if it is acceptable.
-- Security definer so it can read the dictionary the client cannot.
create or replace function check_display_name(input text)
returns table (term text, category moderation_category, match_type moderation_match_type)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  n record;
begin
  select * into n from normalise_display_name(input);

  -- An explicit allow beats everything. Checked first so a carve-out cannot be
  -- overtaken by a broad rule further down the table.
  if exists (
    select 1 from moderation_terms t
    where t.enabled and t.severity = 'allow'
      and (n.normalised = t.term or n.compact = replace(t.term, ' ', ''))
  ) then
    return;
  end if;

  return query
  select t.term, t.category, t.match_type
  from moderation_terms t
  left join moderation_aliases a on a.term_id = t.id
  where t.enabled
    and t.severity = 'block'
    and (
      case t.match_type
        when 'exact' then n.normalised = t.term
        when 'whole_word' then n.normalised ~ ('\m' || regexp_replace(t.term, '([^a-z0-9])', '\\\1', 'g') || '\M')
        when 'contains' then position(t.term in n.normalised) > 0
        when 'compact_contains' then position(replace(t.term, ' ', '') in n.compact) > 0
        when 'prefix' then n.compact like replace(t.term, ' ', '') || '%'
        when 'suffix' then n.compact like '%' || replace(t.term, ' ', '')
      end
      or (a.alias is not null and position(a.alias in n.compact) > 0)
    )
  limit 1;
end;
$$;

revoke all on function check_display_name(text) from public;
grant execute on function check_display_name(text) to authenticated;

-- ── Profiles ─────────────────────────────────────────────────────────────────

-- Stored so a future uniqueness rule, or a report queue, has something indexed
-- to work against; also makes it obvious in the table what a name normalises to.
alter table profiles add column if not exists display_name_normalised text;

create or replace function profiles_guard_display_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hit record;
  n record;
begin
  if new.display_name is null then
    new.display_name_normalised := null;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.display_name is not distinct from old.display_name then
    return new;
  end if;

  new.display_name := btrim(new.display_name);

  if char_length(new.display_name) < 2 or char_length(new.display_name) > 24 then
    raise exception 'display_name_invalid' using errcode = 'check_violation';
  end if;

  select * into hit from check_display_name(new.display_name);
  if found then
    -- The reason goes in the log, not to the client: naming the rule that
    -- fired tells someone exactly what to edit around.
    raise log 'display name rejected: % (term=%, category=%, match=%)',
      new.display_name, hit.term, hit.category, hit.match_type;
    raise exception 'display_name_not_allowed' using errcode = 'check_violation';
  end if;

  select * into n from normalise_display_name(new.display_name);
  new.display_name_normalised := n.normalised;
  return new;
end;
$$;

create trigger profiles_display_name_guard
  before insert or update of display_name on profiles
  for each row execute function profiles_guard_display_name();

-- ── Seed ─────────────────────────────────────────────────────────────────────

-- Reserved and impersonation terms first: these are the operationally important
-- ones, because they are what lets someone pass themselves off as Polari staff.
insert into moderation_terms (term, category, match_type, notes) values
  ('polari', 'reserved', 'compact_contains', 'App name — blocks polariapp, p0lari, polari support'),
  ('admin', 'impersonation', 'compact_contains', null),
  ('administrator', 'impersonation', 'compact_contains', null),
  ('moderator', 'impersonation', 'compact_contains', null),
  ('mod', 'impersonation', 'whole_word', 'whole_word: "mod" is inside model, modern, modest'),
  ('support', 'impersonation', 'compact_contains', null),
  ('staff', 'impersonation', 'compact_contains', null),
  ('official', 'impersonation', 'compact_contains', null),
  ('developer', 'impersonation', 'whole_word', null),
  ('owner', 'impersonation', 'whole_word', null),
  ('system', 'reserved', 'whole_word', null),
  ('security', 'impersonation', 'whole_word', null),
  ('help', 'impersonation', 'whole_word', null),
  ('team', 'impersonation', 'whole_word', 'whole_word: teamwork, steam'),
  ('lorem ipsum creative', 'reserved', 'compact_contains', 'Operator name');

-- A starting profanity/slur set. Short and ambiguous terms are whole_word so
-- they cannot swallow innocent names; unambiguous ones use compact_contains so
-- the normaliser's work counts.
insert into moderation_terms (term, category, match_type, notes) values
  ('fuck', 'profanity', 'compact_contains', null),
  ('shit', 'profanity', 'compact_contains', null),
  ('cunt', 'profanity', 'compact_contains', null),
  ('bitch', 'profanity', 'compact_contains', null),
  ('bastard', 'profanity', 'compact_contains', null),
  ('dick', 'profanity', 'whole_word', 'whole_word: Dickens, Dickinson'),
  ('cock', 'profanity', 'whole_word', 'whole_word: Cocker, cockatoo'),
  ('ass', 'profanity', 'whole_word', 'whole_word: Cassie, Massimo, classic, passion'),
  ('anal', 'sexual', 'whole_word', 'whole_word: analysis, analogue'),
  ('porn', 'sexual', 'compact_contains', null),
  ('rape', 'violence', 'whole_word', 'whole_word: grape, drapes'),
  ('nazi', 'extremism', 'whole_word', null),
  ('hitler', 'extremism', 'compact_contains', null),
  ('isis', 'extremism', 'whole_word', 'whole_word: Isis is also a name and a river'),
  ('kkk', 'extremism', 'compact_contains', null);

-- Religion and politics, per the change request. These are the most likely to
-- need tuning, which is exactly why they are rows rather than code: the policy
-- here is "no religious or political identity as a display name".
insert into moderation_terms (term, category, match_type) values
  ('jesus', 'religion', 'compact_contains'),
  ('christ', 'religion', 'compact_contains'),
  ('allah', 'religion', 'compact_contains'),
  ('muhammad', 'religion', 'compact_contains'),
  ('yahweh', 'religion', 'compact_contains'),
  ('buddha', 'religion', 'compact_contains'),
  ('satan', 'religion', 'compact_contains'),
  ('god', 'religion', 'whole_word'),
  ('devil', 'religion', 'whole_word'),
  ('christian', 'religion', 'whole_word'),
  ('muslim', 'religion', 'whole_word'),
  ('islam', 'religion', 'whole_word'),
  ('jewish', 'religion', 'whole_word'),
  ('judaism', 'religion', 'whole_word'),
  ('hindu', 'religion', 'whole_word'),
  ('buddhist', 'religion', 'whole_word'),
  ('catholic', 'religion', 'whole_word'),
  ('mormon', 'religion', 'whole_word'),
  ('scientology', 'religion', 'compact_contains'),
  ('trump', 'politics', 'whole_word'),
  ('maga', 'politics', 'whole_word'),
  ('biden', 'politics', 'whole_word'),
  ('putin', 'politics', 'whole_word'),
  ('communist', 'politics', 'whole_word'),
  ('fascist', 'politics', 'whole_word'),
  ('antifa', 'politics', 'whole_word'),
  ('president', 'impersonation', 'whole_word'),
  ('prime minister', 'impersonation', 'compact_contains');

-- Aliases: spelling deviations the normaliser cannot reach.
insert into moderation_aliases (term_id, alias)
select id, alias from moderation_terms, unnest(array['fuk', 'fuq', 'fck', 'fack', 'phuck', 'fuxk']) as alias
where term = 'fuck';

insert into moderation_aliases (term_id, alias)
select id, alias from moderation_terms, unnest(array['sh1t', 'shyt', 'schitt']) as alias
where term = 'shit';

insert into moderation_aliases (term_id, alias)
select id, alias from moderation_terms, unnest(array['kunt', 'knut']) as alias
where term = 'cunt';

insert into moderation_aliases (term_id, alias)
select id, alias from moderation_terms, unnest(array['n4zi', 'nazl']) as alias
where term = 'nazi';

-- ── Privacy agreement ────────────────────────────────────────────────────────

-- Recorded per account, like the content advisory, so agreeing on a phone also
-- settles it on the web. Signed-out readers are asked on every cold start,
-- because there is nowhere to record it.
alter table profiles add column if not exists privacy_agreed_at timestamptz;

-- profiles rows are created lazily, so both gates upsert rather than update.
-- The existing owner-only policies cover select and update; insert needs its own.
create policy "profiles are insertable by owner"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);
