-- Flagged entries: the sheet's "Flagged" column, and the only part of its
-- flagging workflow the app sees. "Flag Theme" and "Flag Checked" stay in the
-- sheet as editorial bookkeeping.
--
-- One boolean drives two surfaces: the flag beside a row in the dictionary and
-- curated lists, and the 18+ badge on the definition card.
--
-- NOT NULL with a default rather than a nullable column, because "we have not
-- decided about this entry yet" and "this entry is not flagged" mean the same
-- thing to every reader — an absent flag shows nothing.
alter table public.words
  add column if not exists flagged boolean not null default false;

-- The dictionary list filters on this, so it is worth an index once the table
-- grows; partial because the flagged set is small and it is the only side ever
-- searched for.
create index if not exists words_flagged_idx on public.words(flagged) where flagged;

comment on column public.words.flagged is
  'Sheet "Flagged" column. Drives the dictionary list flag and the 18+ badge on the definition card.';

-- sensitivity_note is deliberately left in place rather than dropped. Its sheet
-- column is gone and the definition card no longer renders it, so nothing writes
-- or reads it any more, but the text it holds was editorial work and dropping a
-- populated column is not reversible. Retire it in a later migration once the
-- content has been moved or confirmed unwanted.
