import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const SPOTIFY_SCOPES = "user-read-private user-read-email playlist-read-private";

export interface SpotifyProfile {
  spotify_user_id: string;
  display_name: string | null;
  profile_image: string | null;
}

/**
 * Redirect URI for Spotify OAuth — hardcoded, evaluated once at module load.
 *
 * The SAME constant is used in every place so the values can never drift:
 *   1. The authorize request  (connect)
 *   2. The token exchange     (callback useEffect)
 *   3. Error diagnostics
 *
 * Register EXACTLY one of these values in:
 *   Spotify Developer Dashboard → your app → Redirect URIs
 *
 *   Local:      http://127.0.0.1:8080
 *   Production: https://vibe-music-app-phi.vercel.app
 *
 * No path suffix. Callback is handled at "/" inside Index.tsx.
 * No env-var override — the value is intentionally hardcoded so it
 * can never be accidentally set to a wrong/null/undefined value.
 */
const REDIRECT_URI: string = import.meta.env.DEV
  ? "http://127.0.0.1:8080"
  : "https://vibe-music-app-phi.vercel.app";

// Guard: catch any build-time misconfiguration before the first user action.
if (!REDIRECT_URI || !REDIRECT_URI.startsWith("http")) {
  throw new Error(
    `[Spotify] REDIRECT_URI is invalid: "${REDIRECT_URI}". ` +
    "Expected http://127.0.0.1:8080 (dev) or https://vibe-music-app-phi.vercel.app (prod)."
  );
}

export function useSpotifyConnection(user: User | null) {
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Load existing connection
  useEffect(() => {
    if (!user || !supabaseConfigured) { setProfile(null); return; }
    supabase
      .from("spotify_connections")
      .select("spotify_user_id, display_name, profile_image")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            spotify_user_id: data.spotify_user_id,
            display_name: data.display_name,
            profile_image: data.profile_image,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  // Start OAuth flow
  const connect = useCallback(() => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      toast.error("Spotify is not configured. Add VITE_SPOTIFY_CLIENT_ID to your .env file.");
      return;
    }
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: SPOTIFY_SCOPES,
      redirect_uri: REDIRECT_URI,
      state: "spotify_connect",
      show_dialog: "true",
    });
    const authorizeUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log("[Spotify] REDIRECT URI:", REDIRECT_URI);
    console.log("[Spotify] AUTHORIZE URL:", authorizeUrl);
    window.location.href = authorizeUrl;
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (!user || !supabaseConfigured) return;
    const url = new URL(window.location.href);
    const state = url.searchParams.get("state");

    // Handle Spotify error redirect (user denied, misconfigured app, etc.)
    const spotifyError = url.searchParams.get("error");
    const spotifyErrorDescription = url.searchParams.get("error_description");
    if (spotifyError && state === "spotify_connect") {
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      url.searchParams.delete("state");
      window.history.replaceState({}, "", url.pathname + url.search);
      if (spotifyError === "access_denied") {
        toast("Spotify connection cancelled.", { duration: 3000 });
      } else {
        toast.error(spotifyErrorDescription || `Spotify error: ${spotifyError}`);
      }
      return;
    }

    const code = url.searchParams.get("code");
    if (!(code && state === "spotify_connect")) return;

    // Clean URL immediately to prevent re-processing on re-render
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url.pathname + url.search);

    // Use the same constant REDIRECT_URI that was used to start the OAuth flow
    let cancelled = false;
    setConnecting(true);
    supabase.functions
      .invoke("spotify-auth", {
        body: { code, redirect_uri: REDIRECT_URI },
      })
      .then(async ({ data, error }) => {
        if (cancelled) return;
        setConnecting(false);
        if (error) {
          let detail = "";
          let echoedUri = "";
          try {
            const body = await (error as any).context?.json?.();
            detail = body?.error ?? "";
            echoedUri = body?.redirect_uri ?? "";
          } catch { /* ignore parse errors */ }
          // Use the redirect URI echoed by the edge function if available, otherwise the constant
          const usedUri = echoedUri || REDIRECT_URI;
          console.error(
            "[Spotify] Auth failed:", detail || error.message,
            "\n  Redirect URI used:", usedUri,
            "\n  Make sure this is registered in your Spotify app dashboard."
          );
          if (detail === "Spotify credentials not configured") {
            toast.error("Spotify not configured on the server — contact the app owner.");
          } else if (detail === "Spotify token exchange failed") {
            toast.error(
              `OAuth failed — register this redirect URI in your Spotify app:\n${usedUri}`,
              { duration: 8000 }
            );
          } else if (detail === "Missing authorization") {
            toast.error("Not signed in — please sign in before connecting Spotify.");
          } else {
            toast.error("Spotify connection failed. Please try again.");
          }
          return;
        }
        if (data) {
          setProfile({
            spotify_user_id: data.spotify_user_id,
            display_name: data.display_name,
            profile_image: data.profile_image,
          });
          toast.success(`Connected as ${data.display_name || "Spotify user"}`);
        }
      });
    return () => { cancelled = true; };
  }, [user]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await supabase
      .from("spotify_connections")
      .delete()
      .eq("user_id", user.id);
    setProfile(null);
    setLoading(false);
  }, [user]);

  return { profile, loading, connecting, connect, disconnect };
}
