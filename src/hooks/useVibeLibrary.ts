import { useState, useCallback, useEffect } from "react";
import { playlists as defaultPlaylists, Playlist, Track } from "@/data/playlists";

const STORAGE_KEY = "vibe-music-library";
const SCHEMA_VERSION_KEY = "vibe-music-schema-version";
const CURRENT_SCHEMA_VERSION = 12; // v12: fix broken energy tracks, replace reggae Tea Roots in Israeli vibe

// Protected base vibe IDs that must always exist
export const REQUIRED_VIBE_IDS = ["80s", "90s-rock", "pop", "energy", "israeli", "classical"];

// Legacy vibe IDs that should be merged into "energy" and removed
const LEGACY_MERGE_INTO_ENERGY = ["workout", "party", "party-mix"];

/**
 * Safe merge: preserves all existing vibes and their tracks.
 * Merges legacy workout/party tracks into energy, then removes legacy vibes.
 * Only adds missing required vibes from defaults.
 * Never overwrites or removes existing data beyond legacy cleanup.
 */
function safeMergeVibes(existing: Playlist[]): Playlist[] {
  // Step 1: Collect tracks from legacy vibes to merge into energy
  const legacyTracks: Track[] = [];
  for (const v of existing) {
    if (LEGACY_MERGE_INTO_ENERGY.includes(v.id)) {
      legacyTracks.push(...v.tracks);
    }
  }

  // Step 2: Remove legacy vibes, keep everything else
  let merged = existing.filter((v) => !LEGACY_MERGE_INTO_ENERGY.includes(v.id));

  // Step 3: Merge legacy tracks into energy (avoiding duplicates by track id)
  if (legacyTracks.length > 0) {
    const energyVibe = merged.find((v) => v.id === "energy");
    if (energyVibe) {
      const existingTrackIds = new Set(energyVibe.tracks.map((t) => t.id));
      const newTracks = legacyTracks.filter((t) => !existingTrackIds.has(t.id));
      energyVibe.tracks = [...energyVibe.tracks, ...newTracks];
    }
  }

  // Step 4: Add any missing required vibes from defaults
  const mergedIds = new Set(merged.map((v) => v.id));
  for (const defaultVibe of defaultPlaylists) {
    if (!mergedIds.has(defaultVibe.id) && REQUIRED_VIBE_IDS.includes(defaultVibe.id)) {
      merged.push({ ...defaultVibe, tracks: [...defaultVibe.tracks] });
    }
  }

  // Step 4.5: Replace built-in track URLs with current defaults.
  // Only tracks whose ID matches a known built-in ID are updated — user-added
  // tracks inside system vibes (which have custom IDs) are left untouched.
  const defaultTrackById = new Map<string, Track>();
  for (const defaultVibe of defaultPlaylists) {
    for (const track of defaultVibe.tracks) {
      defaultTrackById.set(track.id, track);
    }
  }
  merged = merged.map((vibe) => {
    if (!REQUIRED_VIBE_IDS.includes(vibe.id)) return vibe; // never touch custom vibes
    return {
      ...vibe,
      tracks: vibe.tracks.map((t) => defaultTrackById.get(t.id) ?? t),
    };
  });

  // Step 4.6: Sync system vibe track lists with current defaults.
  // Replaces the full track list of each system vibe with the current defaults,
  // then appends any user-added tracks (IDs absent from all default playlists).
  // This removes stale built-in tracks and adds newly introduced built-in tracks.
  const defaultVibeById = new Map(defaultPlaylists.map((v) => [v.id, v]));
  merged = merged.map((vibe) => {
    if (!REQUIRED_VIBE_IDS.includes(vibe.id)) return vibe;
    const defaultVibe = defaultVibeById.get(vibe.id);
    if (!defaultVibe) return vibe;
    const userTracks = vibe.tracks.filter((t) => !defaultTrackById.has(t.id));
    return { ...vibe, tracks: [...defaultVibe.tracks, ...userTracks] };
  });

  // Step 5: Sort — system vibes in canonical order first, then custom vibes
  const systemVibes = merged.filter((v) => REQUIRED_VIBE_IDS.includes(v.id));
  const customVibes = merged.filter((v) => !REQUIRED_VIBE_IDS.includes(v.id));
  systemVibes.sort((a, b) => REQUIRED_VIBE_IDS.indexOf(a.id) - REQUIRED_VIBE_IDS.indexOf(b.id));
  merged = [...systemVibes, ...customVibes];

  return merged;
}

function loadFromStorage(): Playlist[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(SCHEMA_VERSION_KEY);
    const storedVersion = version ? parseInt(version) : 0;

    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    if (storedVersion < CURRENT_SCHEMA_VERSION) {
      // Schema upgraded — safe merge instead of wiping
      const merged = safeMergeVibes(parsed);
      localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(vibes: Playlist[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vibes));
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
  } catch (e) {
    console.warn("Failed to save vibes to localStorage", e);
  }
}

export function useVibeLibrary() {
  const [vibes, setVibes] = useState<Playlist[]>(() => {
    return loadFromStorage() || [...defaultPlaylists];
  });

  useEffect(() => {
    saveToStorage(vibes);
  }, [vibes]);

  const updateVibe = useCallback((id: string, updates: Partial<Omit<Playlist, "id" | "tracks">>) => {
    setVibes((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  }, []);

  const updateVibeTracks = useCallback((id: string, tracks: Track[]) => {
    setVibes((prev) =>
      prev.map((v) => (v.id === id ? { ...v, tracks } : v))
    );
  }, []);

  const addTrackToVibe = useCallback((vibeId: string, track: Track) => {
    setVibes((prev) =>
      prev.map((v) =>
        v.id === vibeId ? { ...v, tracks: [...v.tracks, track] } : v
      )
    );
  }, []);

  const removeTrackFromVibe = useCallback((vibeId: string, trackId: string) => {
    setVibes((prev) =>
      prev.map((v) =>
        v.id === vibeId
          ? { ...v, tracks: v.tracks.filter((t) => t.id !== trackId) }
          : v
      )
    );
  }, []);

  const moveTrack = useCallback((vibeId: string, fromIndex: number, toIndex: number) => {
    setVibes((prev) =>
      prev.map((v) => {
        if (v.id !== vibeId) return v;
        const tracks = [...v.tracks];
        const [moved] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, moved);
        return { ...v, tracks };
      })
    );
  }, []);

  const addCustomVibe = useCallback((vibe: Playlist) => {
    setVibes((prev) => [...prev, vibe]);
  }, []);

  const removeCustomVibe = useCallback((vibeId: string) => {
    if (REQUIRED_VIBE_IDS.includes(vibeId)) return; // protect system vibes
    setVibes((prev) => prev.filter((v) => v.id !== vibeId));
  }, []);

  const resetToDefaults = useCallback(() => {
    // Reset system vibes but keep custom vibes
    setVibes((prev) => {
      const customVibes = prev.filter((v) => !REQUIRED_VIBE_IDS.includes(v.id));
      return [...defaultPlaylists, ...customVibes];
    });
  }, []);

  return {
    vibes,
    setVibes,
    updateVibe,
    updateVibeTracks,
    addTrackToVibe,
    removeTrackFromVibe,
    moveTrack,
    addCustomVibe,
    removeCustomVibe,
    resetToDefaults,
  };
}
