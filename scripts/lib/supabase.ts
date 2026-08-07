// Supabase clients for the Node scripts.
//
// seed-words, apply-words and rls-audit each loaded .env.local, read the same
// environment variables, hand-rolled a "missing variable" error and built a
// client with `auth: { persistSession: false }`. Four copies of the same
// twenty lines, and they had already drifted: two of them named only two
// variables in their error message while checking three.
//
// `persistSession: false` matters in all of them. These are one-shot CLI runs
// with no browser and no storage to persist into; leaving it on makes the
// client try to write a session to disk and hold the process open.
import { config } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Loaded once, on first import, so every caller reads the same environment
// regardless of the order it imports things in.
config({ path: '.env.local' });

const HINT = 'Add it to .env.local (Supabase dashboard → Project Settings → API).';

/**
 * Each variable is read by its literal name rather than through a lookup helper.
 * That is what `expo/no-dynamic-env-var` asks for, and the reason is real even
 * though these are Node scripts: Expo inlines EXPO_PUBLIC_* at build time, so a
 * dynamic `process.env[name]` silently yields undefined anywhere Metro bundles
 * the code. Keeping the static form means these names never become a trap if any
 * of this is ever imported by the app.
 */
function require_(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing ${name}. ${HINT}`);
  return value;
}

const url = () => require_('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);

/**
 * Service-role client: bypasses row-level security, so it is for the seeding
 * and audit scripts only and must never be reachable from app code.
 */
export function adminClient(): SupabaseClient {
  const key = require_('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  return createClient(url(), key, { auth: { persistSession: false } });
}

/**
 * Anonymous client — the same key and privileges the shipped app runs with,
 * which is what makes it the right lens for testing what RLS actually allows.
 */
export function anonClient(): SupabaseClient {
  const key = require_('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  return createClient(url(), key, { auth: { persistSession: false } });
}
