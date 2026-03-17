import { useState, useCallback, useEffect } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { Track } from "@/data/playlists";
import type { User } from "@supabase/supabase-js";

const LOCAL_KEY = "vibe-favorites";

export function useFavorites(user: User | null) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Load from cloud on login
  useEffect(() => {
    if (!user || !supabaseConfigured) return;
    supabase
      .from("favorite_tracks")
      .select("track_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const ids = new Set(data.map((r) => r.track_id));
          setFavoriteIds(ids);
          localStorage.setItem(LOCAL_KEY, JSON.stringify([...ids]));
        }
      })
      .catch(() => {});
  }, [user]);

  const isFavorite = useCallback((trackId: string) => favoriteIds.has(trackId), [favoriteIds]);

  const toggleFavorite = useCallback(async (track: Track) => {
    const isFav = favoriteIds.has(track.id);
    const newIds = new Set(favoriteIds);
    
    if (isFav) {
      newIds.delete(track.id);
      if (user && supabaseConfigured) {
        supabase.from("favorite_tracks")
          .delete()
          .eq("user_id", user.id)
          .eq("track_id", track.id)
          .then(() => {})
          .catch(() => {});
      }
    } else {
      newIds.add(track.id);
      if (user && supabaseConfigured) {
        supabase.from("favorite_tracks")
          .upsert({
            user_id: user.id,
            track_id: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            url: track.url,
          }, { onConflict: "user_id,track_id" })
          .then(() => {})
          .catch(() => {});
      }
    }

    setFavoriteIds(newIds);
    localStorage.setItem(LOCAL_KEY, JSON.stringify([...newIds]));
  }, [favoriteIds, user]);

  return { isFavorite, toggleFavorite, favoriteIds };
}
