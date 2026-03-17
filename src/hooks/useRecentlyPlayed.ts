import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Track } from "@/data/playlists";
import type { User } from "@supabase/supabase-js";

const LOCAL_KEY = "vibe-recently-played";
const MAX_RECENT = 20;

export interface RecentTrack extends Track {
  playedAt: string;
}

export function useRecentlyPlayed(user: User | null) {
  const [recents, setRecents] = useState<RecentTrack[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Load from cloud on login
  useEffect(() => {
    if (!user) return;
    supabase
      .from("recently_played")
      .select("*")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(MAX_RECENT)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const loaded: RecentTrack[] = data.map((r) => ({
            id: r.track_id,
            title: r.title,
            artist: r.artist,
            duration: r.duration,
            url: r.url,
            playedAt: r.played_at ?? new Date().toISOString(),
          }));
          setRecents(loaded);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(loaded));
        }
      })
      .catch(() => {});
  }, [user]);

  const addRecent = useCallback((track: Track) => {
    const now = new Date().toISOString();
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.id !== track.id);
      const updated = [{ ...track, playedAt: now }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      supabase.from("recently_played")
        .insert({
          user_id: user.id,
          track_id: track.id,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          url: track.url,
        })
        .then(() => {})
        .catch(() => {});
    }
  }, [user]);

  return { recents, addRecent };
}
