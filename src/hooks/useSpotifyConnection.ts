import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      console.error("VITE_SPOTIFY_CLIENT_ID not set");
      return;
    }
    const redirectUri = `${window.location.origin}`;
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
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (code && state === "spotify_connect") {
      // Clean URL
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      window.history.replaceState({}, "", url.pathname + url.search);

      setConnecting(true);
      const redirectUri = window.location.origin;
      supabase.functions
        .invoke("spotify-auth", {
          body: { code, redirect_uri: redirectUri },
        })
        .then(({ data, error }) => {
          if (error) {
            console.error("Spotify auth error:", error);
          } else if (data) {
            setProfile({
              spotify_user_id: data.spotify_user_id,
              display_name: data.display_name,
              profile_image: data.profile_image,
            });
          }
          setConnecting(false);
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
