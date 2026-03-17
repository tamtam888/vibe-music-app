import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

// Accept either key name:
//   VITE_SUPABASE_ANON_KEY   — standard Supabase / Vercel env var name
//   VITE_SUPABASE_PUBLISHABLE_KEY — legacy name used in older project setup
const SUPABASE_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);

/** True only when both env vars are present and non-empty. */
export const supabaseConfigured = !!(
  SUPABASE_URL && SUPABASE_URL.startsWith("https://") &&
  SUPABASE_KEY && SUPABASE_KEY.length > 10
);

let _client: SupabaseClient<Database> | null = null;

if (supabaseConfigured) {
  try {
    _client = createClient<Database>(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    // Never crash on startup — log and continue without cloud features
    console.warn("[VIBE Music] Supabase initialization failed:", err);
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
//
// Callers that use supabase inside user-guarded effects are safe (user will be
// null when unconfigured). Callers that call supabase.auth directly must also
// guard with `if (!supabaseConfigured)`.
export const supabase = _client as SupabaseClient<Database>;
