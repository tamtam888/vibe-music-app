import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Track } from "@/data/playlists";
import type { User } from "@supabase/supabase-js";

const LOCAL_KEY = "vibe-resume-state";

export interface ResumeData {
  track: Track;
  positionSeconds: number;
  playlist?: Track[];
}

export function useResumePlayback(user: User | null) {
  const [resumeData, setResumeData] = useState<ResumeData | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load from cloud on login
  useEffect(() => {
    if (!user) return;
    supabase
      .from("resume_state")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          let playlist: Track[] | undefined;
          try {
            playlist = data.playlist_json ? JSON.parse(data.playlist_json) : undefined;
          } catch { playlist = undefined; }

          const loaded: ResumeData = {
            track: {
              id: data.track_id,
              title: data.title,
              artist: data.artist,
              duration: data.duration,
              url: data.url,
            },
            positionSeconds: data.position_seconds ?? 0,
            playlist,
          };
          setResumeData(loaded);
          setDismissed(false);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(loaded));
        }
      })
      .catch(() => {});
  }, [user]);

  const saveResumeState = useCallback((track: Track, positionSeconds: number, playlist?: Track[]) => {
    const data: ResumeData = { track, positionSeconds, playlist };
    setResumeData(data);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));

    if (user) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        supabase.from("resume_state")
          .upsert({
            user_id: user.id,
            track_id: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            url: track.url,
            position_seconds: positionSeconds,
            playlist_json: playlist ? JSON.stringify(playlist) : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" })
          .then(() => {})
          .catch(() => {});
      }, 5000);
    }
  }, [user]);

  const clearResume = useCallback(() => {
    setDismissed(true);
  }, []);

  return { resumeData: dismissed ? null : resumeData, saveResumeState, clearResume };
}
