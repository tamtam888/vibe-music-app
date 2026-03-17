import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const SPOTIFY_SCOPES = "user-read-private user-read-email playlist-read-private";

export interface SpotifyProfile {
  spotify_user_id: string;
  display_name: string | null;
  profile_image: string | null;
}

export function useSpotifyConnection(user: User | null) {
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Load existing connection
  useEffect(() => {
    if (!user) { setProfile(null); return; }
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
      });
  }, [user]);

  // Start OAuth flow
  const connect = useCallback(() => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      toast.error("Spotify is not configured. Add VITE_SPOTIFY_CLIENT_ID to your .env file.");
      return;
    }
    const redirectUri = `${window.location.origin}`;
    console.log("[Spotify] Starting OAuth, redirect URI:", redirectUri);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: SPOTIFY_SCOPES,
      redirect_uri: redirectUri,
      state: "spotify_connect",
      show_dialog: "true",
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (!user) return;
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
    if (code && state === "spotify_connect") {
      // Clean URL immediately to prevent re-processing on re-render
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      window.history.replaceState({}, "", url.pathname + url.search);

      setConnecting(true);
      const redirectUri = window.location.origin;
      supabase.functions
        .invoke("spotify-auth", {
          body: { code, redirect_uri: redirectUri },
        })
        .then(async ({ data, error }) => {
          setConnecting(false);
          if (error) {
            let detail = "";
            try {
              const body = await (error as any).context?.json?.();
              detail = body?.error ?? "";
            } catch { /* ignore parse errors */ }
            console.error("[Spotify] Auth failed:", detail || error.message);
            if (detail === "Spotify credentials not configured") {
              toast.error("Spotify not configured on the server — contact the app owner.");
            } else if (detail === "Spotify token exchange failed") {
              toast.error("OAuth failed — verify the redirect URI is registered in your Spotify app settings.");
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
          }
        });
    }
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
