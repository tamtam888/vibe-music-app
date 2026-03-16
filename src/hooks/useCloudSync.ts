import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playlists as defaultPlaylists, Playlist, Track } from "@/data/playlists";
import type { User } from "@supabase/supabase-js";

import { REQUIRED_VIBE_IDS } from "@/hooks/useVibeLibrary";
const LEGACY_MERGE_INTO_ENERGY = ["workout", "party", "party-mix"];

interface CloudSyncOptions {
  user: User | null;
  vibes: Playlist[];
  setVibes: (vibes: Playlist[]) => void;
  shuffle: boolean;
  aiFlow: boolean;
  language: string;
  theme: string;
}

export function useCloudSync({
  user,
  vibes,
  setVibes,
  shuffle,
  aiFlow,
  language,
  theme,
}: CloudSyncOptions) {
  const syncingRef = useRef(false);
  const initialLoadDone = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load cloud data on login
  const loadCloudData = useCallback(async (userId: string) => {
    try {
      syncingRef.current = true;

      // Load vibes
      const { data: cloudVibes } = await supabase
        .from("user_vibes")
        .select("*")
        .eq("user_id", userId)
        .order("position");

      if (cloudVibes && cloudVibes.length > 0) {
        // Load tracks for each vibe
        const { data: cloudTracks } = await supabase
          .from("user_tracks")
          .select("*")
          .eq("user_id", userId)
          .order("position");

        const tracksByVibe: Record<string, Track[]> = {};
        (cloudTracks || []).forEach((ct) => {
          if (!tracksByVibe[ct.vibe_id]) tracksByVibe[ct.vibe_id] = [];
          tracksByVibe[ct.vibe_id].push({
            id: ct.track_id,
            title: ct.title,
            artist: ct.artist,
            duration: ct.duration,
            url: ct.url,
            energy: ct.energy ?? undefined,
            mood: (ct.mood as Track["mood"]) ?? undefined,
            texture: (ct.texture as Track["texture"]) ?? undefined,
            isBridge: ct.is_bridge ?? undefined,
            source: (ct as any).source ?? undefined,
            spotify_url: (ct as any).spotify_url ?? undefined,
            spotify_id: (ct as any).spotify_id ?? undefined,
            item_type: (ct as any).item_type ?? undefined,
            subtitle: (ct as any).subtitle ?? undefined,
            image: (ct as any).image ?? undefined,
            metadata_fetched_at: (ct as any).metadata_fetched_at ?? undefined,
          });
        });

        let reconstructed: Playlist[] = cloudVibes.map((cv) => ({
          id: cv.vibe_id,
          name: cv.name,
          emoji: cv.emoji,
          description: cv.description,
          color: cv.color,
          tracks: tracksByVibe[cv.vibe_id] || [],
          isCustom: !REQUIRED_VIBE_IDS.includes(cv.vibe_id) || undefined,
        }));

        // Migrate legacy vibes into energy
        const legacyTracks: Track[] = [];
        for (const v of reconstructed) {
          if (LEGACY_MERGE_INTO_ENERGY.includes(v.id)) {
            legacyTracks.push(...v.tracks);
          }
        }
        reconstructed = reconstructed.filter((v) => !LEGACY_MERGE_INTO_ENERGY.includes(v.id));
        if (legacyTracks.length > 0) {
          const energyVibe = reconstructed.find((v) => v.id === "energy");
          if (energyVibe) {
            const existingIds = new Set(energyVibe.tracks.map((t) => t.id));
            energyVibe.tracks.push(...legacyTracks.filter((t) => !existingIds.has(t.id)));
          }
        }

        // Keep all vibes (system + custom), add missing system defaults
        const existingIds = new Set(reconstructed.map((v) => v.id));
        for (const dv of defaultPlaylists) {
          if (!existingIds.has(dv.id) && REQUIRED_VIBE_IDS.includes(dv.id)) {
            reconstructed.push({ ...dv, tracks: [...dv.tracks] });
          }
        }
        // Sort: system vibes in canonical order first, then custom vibes
        const systemVibes = reconstructed.filter((v) => REQUIRED_VIBE_IDS.includes(v.id));
        const customVibes = reconstructed.filter((v) => !REQUIRED_VIBE_IDS.includes(v.id));
        systemVibes.sort((a, b) => REQUIRED_VIBE_IDS.indexOf(a.id) - REQUIRED_VIBE_IDS.indexOf(b.id));
        reconstructed = [...systemVibes, ...customVibes];

        setVibes(reconstructed);
      }

      initialLoadDone.current = true;
    } catch (err) {
      console.warn("Cloud load failed, using local data", err);
      initialLoadDone.current = true;
    } finally {
      syncingRef.current = false;
    }
  }, [setVibes]);

  // Save vibes/tracks to cloud
  const saveToCloud = useCallback(
    async (userId: string, currentVibes: Playlist[]) => {
      if (syncingRef.current || !initialLoadDone.current) return;
      try {
        // Upsert vibes
        const vibeRows = currentVibes.map((v, i) => ({
          user_id: userId,
          vibe_id: v.id,
          name: v.name,
          emoji: v.emoji,
          description: v.description,
          color: v.color,
          position: i,
        }));

        // Compute track rows before any destructive operations
        const currentVibeIds = currentVibes.map((v) => v.id);
        const trackRows = currentVibes.flatMap((v) =>
          v.tracks.map((tr, i) => ({
            user_id: userId,
            vibe_id: v.id,
            track_id: tr.id,
            title: tr.title,
            artist: tr.artist,
            duration: tr.duration,
            url: tr.url,
            energy: tr.energy ?? null,
            mood: tr.mood ?? null,
            texture: tr.texture ?? null,
            is_bridge: tr.isBridge ?? false,
            position: i,
            source: tr.source ?? null,
            spotify_url: tr.spotify_url ?? null,
            spotify_id: tr.spotify_id ?? null,
            item_type: tr.item_type ?? null,
            subtitle: tr.subtitle ?? null,
            image: tr.image ?? null,
            metadata_fetched_at: tr.metadata_fetched_at ?? null,
          }))
        );

        // Guard: skip destructive ops if library is unexpectedly empty
        if (currentVibes.length === 0) return;

        // Delete vibes that no longer exist, then upsert current ones
        await supabase
          .from("user_vibes")
          .delete()
          .eq("user_id", userId)
          .not("vibe_id", "in", `(${currentVibeIds.map((id) => `"${id}"`).join(",")})`);

        await supabase.from("user_vibes").upsert(vibeRows, {
          onConflict: "user_id,vibe_id",
        });

        // Delete old tracks, insert new
        await supabase.from("user_tracks").delete().eq("user_id", userId);
        if (trackRows.length > 0) {
          await supabase.from("user_tracks").insert(trackRows);
        }
      } catch (err) {
        console.warn("Cloud save failed", err);
      }
    },
    []
  );

  // Save settings to cloud
  const saveSettings = useCallback(
    async (userId: string, settings: { shuffle: boolean; ai_flow: boolean; language: string; theme: string }) => {
      if (!initialLoadDone.current) return;
      try {
        await supabase.from("user_settings").upsert(
          { user_id: userId, ...settings, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      } catch (err) {
        console.warn("Settings save failed", err);
      }
    },
    []
  );

  // Load on login
  useEffect(() => {
    if (user) {
      initialLoadDone.current = false;
      loadCloudData(user.id);
    } else {
      initialLoadDone.current = false;
    }
  }, [user, loadCloudData]);

  // Debounced save vibes on change
  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToCloud(user.id, vibes);
    }, 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user, vibes, saveToCloud]);

  // Save settings on change
  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    saveSettings(user.id, { shuffle, ai_flow: aiFlow, language, theme });
  }, [user, shuffle, aiFlow, language, theme, saveSettings]);

  // Load settings on login
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          // Settings loaded — parent component should apply these
          // We emit via a custom event to avoid circular deps
          window.dispatchEvent(
            new CustomEvent("vibe-cloud-settings", {
              detail: {
                shuffle: data.shuffle,
                aiFlow: data.ai_flow,
                language: data.language,
                theme: data.theme,
              },
            })
          );
        }
      });
  }, [user]);
}
