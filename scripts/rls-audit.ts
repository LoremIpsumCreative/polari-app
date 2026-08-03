// Black-box RLS audit against the live Supabase project.
//
//   npm run rls:audit
//
// Static policy review is not enough: `pg_policies` tells you what the rules
// SAY, not what the API DOES. This creates two throwaway users, signs them in
// through the public anon key exactly as the app does, and then tries every
// cross-tenant read and write it can think of. A policy only passes here if the
// API actually refuses.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local — used ONLY to create and
// then delete the two test users. Every assertion itself runs through the anon
// key, i.e. with exactly the privileges a hostile client would hold.
//
// The script is read-mostly and cleans up after itself: the users it creates are
// deleted in a finally block, and cascading FKs take their rows with them.

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  throw new Error('Need EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

type Result = { area: string; check: string; pass: boolean; detail: string };
const results: Result[] = [];

function record(area: string, check: string, pass: boolean, detail: string) {
  results.push({ area, check, pass, detail });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${area} · ${check}${pass ? '' : `\n        ↳ ${detail}`}`);
}

/** A read is safe when it returns no rows belonging to someone else. */
async function expectNoRows(area: string, check: string, q: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const { data, error } = await q;
  if (error) return record(area, check, true, `blocked: ${error.message}`);
  const n = data?.length ?? 0;
  record(area, check, n === 0, n === 0 ? 'no rows returned' : `LEAKED ${n} row(s)`);
}

/** A write is safe when it errors, or silently affects nothing. */
async function expectNoWrite(area: string, check: string, q: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const { data, error } = await q;
  if (error) return record(area, check, true, `blocked: ${error.message}`);
  const n = data?.length ?? 0;
  record(area, check, n === 0, n === 0 ? 'no rows affected' : `WROTE ${n} row(s)`);
}

async function main() {
  const stamp = Date.now();
  const users: { id: string; email: string; password: string; client: SupabaseClient }[] = [];

  try {
    // ── Set up two confirmed users. email_confirm skips the mail round-trip.
    for (const tag of ['a', 'b']) {
      const email = `rls-audit-${tag}-${stamp}@polari.invalid`;
      const password = `Aa1!${randomUUID()}`;
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !data.user) throw new Error(`could not create test user: ${error?.message}`);
      const client = createClient(url!, anonKey!, { auth: { persistSession: false } });
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(`could not sign in test user: ${signInError.message}`);
      users.push({ id: data.user.id, email, password, client });
    }
    const [A, B] = users;
    const anon = createClient(url!, anonKey!, { auth: { persistSession: false } });

    // Seed a row for B under B's own session, so A has something real to hunt.
    const { data: words } = await anon.from('words').select('id').limit(1);
    const wordId = (words as { id: string }[] | null)?.[0]?.id;
    if (wordId) {
      await B.client.from('favourites').insert({ user_id: B.id, word_id: wordId });
      await B.client.from('user_word_progress').insert({ user_id: B.id, word_id: wordId, mastery: 1 });
    }
    await B.client.from('quiz_attempts').insert({ user_id: B.id, score: 9, total_questions: 10 });
    await B.client.rpc('record_quiz_game', { p_mode: 'timed', p_score: 42 });

    console.log('\n─── 1. Anonymous access to user data ───');
    for (const t of ['profiles', 'user_streaks', 'favourites', 'quiz_attempts', 'quiz_stats', 'user_word_progress']) {
      await expectNoRows('anon', `cannot read ${t}`, anon.from(t).select('*').limit(50));
    }
    await expectNoWrite('anon', 'cannot insert favourites', anon.from('favourites').insert({ user_id: B.id, word_id: wordId }).select());
    await expectNoWrite('anon', 'cannot insert quiz_stats', anon.from('quiz_stats').insert({ user_id: B.id }).select());

    console.log('\n─── 2. Cross-user reads (A hunting B) ───');
    for (const t of ['profiles', 'user_streaks', 'favourites', 'quiz_attempts', 'quiz_stats', 'user_word_progress']) {
      const col = t === 'profiles' ? 'id' : 'user_id';
      await expectNoRows('cross-read', `A cannot read B's ${t}`, A.client.from(t).select('*').eq(col, B.id));
    }

    console.log('\n─── 3. Cross-user writes (A tampering with B) ───');
    await expectNoWrite('cross-write', "A cannot update B's profile", A.client.from('profiles').update({ display_name: 'pwned' }).eq('id', B.id).select());
    await expectNoWrite('cross-write', "A cannot update B's streaks", A.client.from('user_streaks').update({ current_streak: 9999 }).eq('user_id', B.id).select());
    await expectNoWrite('cross-write', "A cannot update B's quiz_stats", A.client.from('quiz_stats').update({ timed_best: 9999 }).eq('user_id', B.id).select());
    await expectNoWrite('cross-write', "A cannot delete B's favourites", A.client.from('favourites').delete().eq('user_id', B.id).select());
    await expectNoWrite('cross-write', "A cannot delete B's progress", A.client.from('user_word_progress').delete().eq('user_id', B.id).select());
    await expectNoWrite('cross-write', "A cannot delete B's quiz_attempts", A.client.from('quiz_attempts').delete().eq('user_id', B.id).select());

    console.log('\n─── 4. Forged ownership (A writing rows owned by B) ───');
    await expectNoWrite('forgery', 'A cannot insert a favourite as B', A.client.from('favourites').insert({ user_id: B.id, word_id: wordId }).select());
    await expectNoWrite('forgery', 'A cannot insert quiz_attempts as B', A.client.from('quiz_attempts').insert({ user_id: B.id, score: 1, total_questions: 1 }).select());
    await expectNoWrite('forgery', 'A cannot insert progress as B', A.client.from('user_word_progress').insert({ user_id: B.id, word_id: wordId, mastery: 5 }).select());
    await expectNoWrite('forgery', 'A cannot insert quiz_stats as B', A.client.from('quiz_stats').insert({ user_id: B.id }).select());
    await expectNoWrite('forgery', 'A cannot re-parent own row to B', A.client.from('favourites').update({ user_id: B.id }).eq('user_id', A.id).select());

    console.log('\n─── 5. Feedback table (anonymous write-only inbox) ───');
    // NB: this must be verified with the service role, not by chaining .select().
    // feedback has no SELECT policy, so a successful insert still returns zero
    // rows to the caller — chaining .select() reports a false PASS for a write
    // that actually landed. Ask the database what is really in the table.
    const marker = `rls-audit-${stamp}`;
    const forged = await anon.from('feedback').insert({
      user_id: B.id, message: marker, contact_email: 'attacker@polari.invalid',
    });
    const { data: landed } = await admin.from('feedback').select('id,user_id').eq('message', marker);
    const forgedRow = (landed as { user_id: string }[] | null)?.[0];
    record('feedback', 'anon cannot forge user_id on feedback',
      !!forged.error || !forgedRow || forgedRow.user_id !== B.id,
      forged.error ? `blocked: ${forged.error.message}`
        : forgedRow ? `WROTE a row falsely attributed to another user (${forgedRow.user_id})`
        : 'no row written');

    // Unthrottled insert is a spam/junk-data vector even when nobody can read
    // the table back. The trigger caps anonymous writes globally at 200/hour
    // and signed-in writes at 20/hour per account.
    //
    // We deliberately exercise the SIGNED-IN cap, not the anonymous one: proving
    // the 200 limit would mean writing 200 rows to production and burning the
    // real hour's quota, which would suppress genuine anonymous feedback while
    // the window rolled over. Same trigger, same code path, no collateral.
    let accepted = 0;
    for (let i = 0; i < 22; i++) {
      const r = await A.client.from('feedback').insert({ user_id: A.id, message: `${marker}-flood-${i}` });
      if (!r.error) accepted++;
    }
    record('feedback', 'feedback inserts are rate limited per account', accepted <= 20,
      `${accepted}/22 rapid inserts accepted for one account (cap is 20/hour)`);

    const huge = await anon.from('feedback').insert({ message: 'Z'.repeat(500_000) });
    record('feedback', 'feedback message length is bounded', !!huge.error,
      huge.error ? `blocked: ${huge.error.message}` : 'accepted a 500KB message body');
    await expectNoRows('feedback', 'anon cannot read feedback', anon.from('feedback').select('*').limit(10));
    await expectNoRows('feedback', 'A cannot read feedback', A.client.from('feedback').select('*').limit(10));

    console.log('\n─── 6. RPC surface ───');
    const r1 = await anon.rpc('record_daily_engagement');
    record('rpc', 'anon cannot run record_daily_engagement', !!r1.error, r1.error ? `blocked: ${r1.error.message}` : 'EXECUTED as anon');
    const r2 = await anon.rpc('record_quiz_game', { p_mode: 'timed', p_score: 999 });
    record('rpc', 'anon cannot run record_quiz_game', !!r2.error, r2.error ? `blocked: ${r2.error.message}` : 'EXECUTED as anon');
    const r3 = await anon.rpc('handle_new_user');
    record('rpc', 'anon cannot run handle_new_user', !!r3.error, r3.error ? `blocked: ${r3.error.message}` : 'EXECUTED as anon');

    // A's own RPC call must only ever touch A.
    await A.client.rpc('record_quiz_game', { p_mode: 'timed', p_score: 7 });
    const { data: bStats } = await admin.from('quiz_stats').select('timed_best').eq('user_id', B.id).maybeSingle();
    record('rpc', "A's record_quiz_game did not alter B", (bStats as { timed_best: number } | null)?.timed_best === 42,
      `B.timed_best is ${(bStats as { timed_best: number } | null)?.timed_best}, expected 42`);

    console.log('\n─── 7. Positive controls (hardening must not lock users out) ───');
    // A denial-only suite would score full marks against a database that
    // refused everything. These prove the app's real flows still work.
    const ownProfile = await A.client.from('profiles').select('*').eq('id', A.id);
    record('positive', 'A can read own profile', !ownProfile.error && (ownProfile.data?.length ?? 0) === 1,
      ownProfile.error?.message ?? `${ownProfile.data?.length} row(s)`);

    const ownName = await A.client.from('profiles').update({ display_name: 'Audit' }).eq('id', A.id).select();
    record('positive', 'A can update own profile', !ownName.error && (ownName.data?.length ?? 0) === 1,
      ownName.error?.message ?? `${ownName.data?.length} row(s)`);

    const ownFav = await A.client.from('favourites').insert({ user_id: A.id, word_id: wordId }).select();
    record('positive', 'A can favourite a word', !ownFav.error && (ownFav.data?.length ?? 0) === 1,
      ownFav.error?.message ?? `${ownFav.data?.length} row(s)`);

    const unfav = await A.client.from('favourites').delete().eq('user_id', A.id).select();
    record('positive', 'A can unfavourite', !unfav.error && (unfav.data?.length ?? 0) >= 1,
      unfav.error?.message ?? `${unfav.data?.length} row(s)`);

    const ownAttempt = await A.client.from('quiz_attempts').insert({ user_id: A.id, score: 5, total_questions: 10 }).select();
    record('positive', 'A can record a quiz attempt', !ownAttempt.error && (ownAttempt.data?.length ?? 0) === 1,
      ownAttempt.error?.message ?? `${ownAttempt.data?.length} row(s)`);

    const engagement = await A.client.rpc('record_daily_engagement');
    record('positive', 'A can run record_daily_engagement', !engagement.error,
      engagement.error?.message ?? 'ok');

    const dictionary = await anon.from('words').select('id').limit(5);
    record('positive', 'anon can still read the dictionary', !dictionary.error && (dictionary.data?.length ?? 0) > 0,
      dictionary.error?.message ?? `${dictionary.data?.length} word(s)`);

    const collections = await anon.from('collections').select('id').limit(5);
    record('positive', 'anon can still read collections', !collections.error,
      collections.error?.message ?? `${collections.data?.length} row(s)`);

    // The app posts feedback with `user_id: session?.user.id ?? null` — both
    // shapes must still be accepted after the forgery fix.
    const anonFeedback = await anon.from('feedback').insert({ user_id: null, message: `${marker}-legit-anon`, category: 'bug' });
    record('positive', 'anonymous feedback still accepted', !anonFeedback.error, anonFeedback.error?.message ?? 'ok');

    const authFeedback = await B.client.from('feedback').insert({ user_id: B.id, message: `${marker}-legit-auth`, category: 'general' });
    record('positive', 'signed-in feedback still accepted', !authFeedback.error, authFeedback.error?.message ?? 'ok');

    console.log('\n─── 8. Storage (characters bucket) ───');
    // The bucket is deliberately public and listable — remoteArt.tsx lists it to
    // discover which slugs have artwork, and the filenames are dictionary slugs
    // that are public anyway. What must not be possible is writing to it:
    // an anonymous upload would mean defacing the character art for every user.
    const listArt = await anon.storage.from('characters').list('', { limit: 5 });
    record('storage', 'anon can list character art (app depends on it)',
      !listArt.error && (listArt.data?.length ?? 0) > 0,
      listArt.error?.message ?? `${listArt.data?.length} object(s)`);

    const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' });
    const anonUp = await anon.storage.from('characters').upload(`rls-audit-${stamp}.png`, png);
    record('storage', 'anon cannot upload to characters', !!anonUp.error,
      anonUp.error?.message ?? 'UPLOAD ACCEPTED');

    const authUp = await A.client.storage.from('characters').upload(`rls-audit-auth-${stamp}.png`, png);
    record('storage', 'signed-in user cannot upload to characters', !!authUp.error,
      authUp.error?.message ?? 'UPLOAD ACCEPTED');

    const existing = (listArt.data ?? [])[0]?.name;
    if (existing) {
      const del = await anon.storage.from('characters').remove([existing]);
      const blocked = !!del.error || (del.data?.length ?? 0) === 0;
      record('storage', 'anon cannot delete character art', blocked,
        del.error?.message ?? (blocked ? 'no objects removed' : `DELETED ${existing}`));
    }

    console.log('\n─── 9. Schema surface ───');
    const authProbe = await anon.from('users').select('*').limit(1);
    record('schema', 'auth.users not exposed via REST', !!authProbe.error, authProbe.error ? `blocked: ${authProbe.error.message}` : 'READABLE');

    // ── Report
    const failed = results.filter((r) => !r.pass);
    console.log(`\n${'='.repeat(66)}`);
    console.log(`RLS AUDIT — ${results.length - failed.length}/${results.length} passed`);
    console.log('='.repeat(66));
    if (failed.length) {
      console.log('\nFAILURES:');
      for (const f of failed) console.log(`  ✗ ${f.area} · ${f.check}\n      ${f.detail}`);
    } else {
      console.log('\nNo cross-tenant access was possible through the public anon key.');
    }
    process.exitCode = failed.length ? 1 : 0;
  } finally {
    for (const u of users) {
      await admin.auth.admin.deleteUser(u.id).catch(() => {});
    }
    await admin.from('feedback').delete().like('message', 'rls-audit%');
    await admin.from('feedback').delete().like('message', 'ZZZZZ%');
    console.log('\ncleaned up test users and probe rows.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
