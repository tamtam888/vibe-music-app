import { Track, Playlist, TrackMood, TrackTexture } from "@/data/playlists";

// Canonical metadata defaults per system vibe.
// Used as fallback when a track has no explicit metadata.
export const VIBE_DEFAULTS: Record<string, { energy: number; mood: TrackMood; texture: TrackTexture }> = {
  "80s":       { energy: 5, mood: "uplifting", texture: "electronic" },
  "90s-rock":  { energy: 7, mood: "driving",   texture: "guitar" },
  "pop":       { energy: 6, mood: "uplifting", texture: "vocal" },
  "energy":    { energy: 9, mood: "driving",   texture: "electronic" },
  "israeli":   { energy: 5, mood: "emotional", texture: "vocal" },
  "classical": { energy: 3, mood: "calm",      texture: "classical" },
};

export const CUSTOM_VIBE_DEFAULT = {
  energy: 5,
  mood: "warm" as TrackMood,
  texture: "vocal" as TrackTexture,
};

// ── Metadata resolution (with fallback) ──────────────────────────────────────

export function getTrackEnergy(track: Track, vibeId?: string): number {
  if (track.energy != null) return track.energy;
  return VIBE_DEFAULTS[vibeId || ""]?.energy ?? CUSTOM_VIBE_DEFAULT.energy;
}

export function getTrackMood(track: Track, vibeId?: string): TrackMood {
  if (track.mood) return track.mood;
  return VIBE_DEFAULTS[vibeId || ""]?.mood ?? CUSTOM_VIBE_DEFAULT.mood;
}

export function getTrackTexture(track: Track, vibeId?: string): TrackTexture {
  if (track.texture) return track.texture;
  return VIBE_DEFAULTS[vibeId || ""]?.texture ?? CUSTOM_VIBE_DEFAULT.texture;
}

export function findVibeForTrack(track: Track, vibes: Playlist[]): string | undefined {
  for (const v of vibes) {
    if (v.tracks.some((t) => t.id === track.id)) return v.id;
  }
  return undefined;
}

export function isBridgeCandidate(track: Track): boolean {
  return track.isBridge === true || track.texture === "classical" || track.texture === "instrumental";
}

// ── Discover / matching foundation ───────────────────────────────────────────

export interface VibeSignature {
  energyMin: number;
  energyMax: number;
  energyCenter: number;
  dominantMood: TrackMood | null;
  dominantTexture: TrackTexture | null;
  /**
   * Number of tracks with explicit energy metadata used to build this signature.
   * 0 means no track data was available and the signature fell back to defaults.
   */
  sampleSize: number;
}

/**
 * Derive a vibe's signature purely from its track list.
 * Only tracks with explicit `energy` values are used.
 * Falls back to VIBE_DEFAULTS for known system vibes, or CUSTOM_VIBE_DEFAULT otherwise.
 * Does not fake or infer values that aren't in the data.
 */
export function deriveVibeSignature(vibe: Playlist): VibeSignature {
  const withMeta = vibe.tracks.filter((t) => t.energy != null);

  if (withMeta.length === 0) {
    const d = VIBE_DEFAULTS[vibe.id] ?? CUSTOM_VIBE_DEFAULT;
    return {
      energyMin: d.energy,
      energyMax: d.energy,
      energyCenter: d.energy,
      dominantMood: d.mood,
      dominantTexture: d.texture,
      sampleSize: 0,
    };
  }

  const energies = withMeta.map((t) => t.energy!);
  const energyMin = Math.min(...energies);
  const energyMax = Math.max(...energies);
  const energyCenter = energies.reduce((a, b) => a + b, 0) / energies.length;

  // Dominant mood (mode over tracks with explicit mood)
  const moodCounts: Partial<Record<TrackMood, number>> = {};
  for (const t of withMeta) {
    if (t.mood) moodCounts[t.mood] = (moodCounts[t.mood] ?? 0) + 1;
  }
  const dominantMood =
    (Object.entries(moodCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as TrackMood) ?? null;

  // Dominant texture (mode over tracks with explicit texture)
  const textureCounts: Partial<Record<TrackTexture, number>> = {};
  for (const t of withMeta) {
    if (t.texture) textureCounts[t.texture] = (textureCounts[t.texture] ?? 0) + 1;
  }
  const dominantTexture =
    (Object.entries(textureCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as TrackTexture) ?? null;

  return { energyMin, energyMax, energyCenter, dominantMood, dominantTexture, sampleSize: withMeta.length };
}

/**
 * Score how well a track fits a vibe signature. Returns 0–100.
 * Based only on explicitly tagged metadata — no inference or fake BPM analysis.
 *
 * Scoring breakdown:
 *   - Energy proximity: up to −60 penalty (10pts per unit away from energyCenter)
 *   - Energy within vibe range: +10 bonus
 *   - Mood match: +20 bonus
 *   - Texture match: +15 bonus
 */
export function trackVibeScore(track: Track, signature: VibeSignature): number {
  const trackEnergy = track.energy ?? signature.energyCenter;

  let score = 100;

  score -= Math.abs(trackEnergy - signature.energyCenter) * 10;

  if (trackEnergy >= signature.energyMin && trackEnergy <= signature.energyMax) score += 10;

  if (signature.dominantMood && track.mood === signature.dominantMood) score += 20;

  if (signature.dominantTexture && track.texture === signature.dominantTexture) score += 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Rank all vibes by how well a given track fits them.
 * Returns sorted descending by score.
 * Useful for Discover: "which vibes would this track belong in?"
 */
export function rankVibesForTrack(
  track: Track,
  vibes: Playlist[]
): Array<{ vibe: Playlist; score: number }> {
  return vibes
    .map((vibe) => ({ vibe, score: trackVibeScore(track, deriveVibeSignature(vibe)) }))
    .sort((a, b) => b.score - a.score);
}
