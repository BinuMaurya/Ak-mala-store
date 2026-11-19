import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Reads the first non-empty value from the given public env entries.
 * Values are trimmed because a stray space, quote or newline pasted into
 * `.env` produces an invalid URL or a 401 from the Auth/REST APIs.
 */
function readEnv(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed) return trimmed;
  }
  return '';
}

// `vite.config.ts` falls back to the server-side SUPABASE_URL /
// SUPABASE_PUBLISHABLE_KEY names when the VITE_* overrides are absent, so
// both spellings resolve to the same public project here.
const supabaseUrl = readEnv(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const supabaseAnonKey = readEnv(
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Keep the owner/customer OTP session across reloads and tabs.
        persistSession: true,
        // Refresh the access token before it expires so admin calls keep working.
        autoRefreshToken: true,
        // Magic-link emails land back on the app with the session in the URL.
        detectSessionInUrl: true
      }
    })
  : null;

if (!supabase) {
  console.warn(
    '[supabase] Client disabled: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
      '(or SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY) in .env, then restart the dev server.'
  );
}
