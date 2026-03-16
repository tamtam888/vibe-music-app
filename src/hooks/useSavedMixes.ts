import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Track } from "@/data/playlists";
import type { User } from "@supabase/supabase-js";

export interface SavedMix {
  id: string;
  name: string;
  mixType: "ai_flow" | "manual";
  createdAt: string;
  tracks: Track[];
}

export function useSavedMixes(user: User | null) {
  const [mixes, setMixes] = useState<SavedMix[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMixes = useCallback(async () => {
    if (!user) { setMixes([]); return; }
    setLoading(true);
    try {
      const { data: mixRows } = await supabase
        .from("saved_mixes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mixRows || mixRows.length === 0) { setMixes([]); setLoading(false); return; }

      const mixIds = mixRows.map((m) => m.id);
      const { data: trackRows } = await supabase
        .from("saved_mix_tracks")
        .select("*")
        .in("mix_id", mixIds)
        .order("position");

      const tracksByMix: Record<string, Track[]> = {};
      (trackRows || []).forEach((t) => {
        if (!tracksByMix[t.mix_id]) tracksByMix[t.mix_id] = [];
        tracksByMix[t.mix_id].push({
          id: t.track_id,
          title: t.title,
          artist: t.artist,
          duration: t.duration,
          url: t.url,
          isBridge: t.is_bridge ?? undefined,
        });
      });

      setMixes(
        mixRows.map((m) => ({
          id: m.id,
          name: m.name,
          mixType: m.mix_type as "ai_flow" | "manual",
          createdAt: m.created_at ?? new Date().toISOString(),
          tracks: tracksByMix[m.id] || [],
        }))
      );
    } catch (err) {
      console.warn("Failed to load mixes", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadMixes(); }, [loadMixes]);

  const saveMix = useCallback(
    async (name: string, tracks: Track[], mixType: "ai_flow" | "manual") => {
      if (!user) return;
      try {
        const { data: mix, error } = await supabase
          .from("saved_mixes")
          .insert({ user_id: user.id, name, mix_type: mixType })
          .select()
          .single();

        if (error || !mix) throw error;

        const trackRows = tracks.map((t, i) => ({
          mix_id: mix.id,
          track_id: t.id,
          title: t.title,
          artist: t.artist,
          duration: t.duration,
          url: t.url,
          position: i,
          is_bridge: t.isBridge ?? false,
        }));

        if (trackRows.length > 0) {
          await supabase.from("saved_mix_tracks").insert(trackRows);
        }

        await loadMixes();
      } catch (err) {
        console.warn("Failed to save mix", err);
      }
    },
    [user, loadMixes]
  );

  const deleteMix = useCallback(
    async (mixId: string) => {
      if (!user) return;
      try {
        await supabase.from("saved_mixes").delete().eq("id", mixId);
        setMixes((prev) => prev.filter((m) => m.id !== mixId));
      } catch (err) {
        console.warn("Failed to delete mix", err);
      }
    },
    [user]
  );

  return { mixes, loading, saveMix, deleteMix, loadMixes };
}
