/**
 * Email auth redirect URL — hardcoded, no env-var override.
 *
 * Supabase sends this URL in confirmation and magic-link emails.
 * The user lands here; the Supabase JS client automatically reads
 * the #access_token hash and fires onAuthStateChange("SIGNED_IN").
 *
 * Register EXACTLY this value in:
 *   Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
 *
 *   Local:      http://127.0.0.1:8080
 *   Production: https://vibe-music-app-phi.vercel.app
 *
 * No /auth suffix — the callback is handled at "/" by ProtectedRoute
 * + AuthContext, which detect the hash and wait for the session.
 */
export const AUTH_REDIRECT_URL: string = import.meta.env.DEV
  ? "http://127.0.0.1:8080"
  : "https://vibe-music-app-phi.vercel.app";

console.log("[Auth] Email redirect URL:", AUTH_REDIRECT_URL);
