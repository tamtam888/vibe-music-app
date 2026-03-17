import { useCallback } from "react";
import { Track, Playlist } from "@/data/playlists";
import {
  getTrackEnergy,
  getTrackMood,
  getTrackTexture,
  findVibeForTrack,
} from "@/lib/vibeMatch";

/**
 * Beat Match: selects the next track with the closest BPM to the current track.
 *
 * Scoring (lower is worse):
 *   Primary   — BPM proximity: −2 pts per BPM unit of difference
 *               Falls back to energy proximity (−10 per unit) when either track has no BPM
 *   Secondary — energy proximity: −3 pts per unit (always applied)
 *   Bonus     — mood match: +8 pts
 *   Bonus     — texture match: +5 pts
 *   Penalty   — recently played: −40 pts
 *   Tiebreak  — small random nudge: 0–4 pts
 *
 * This uses only static metadata from track objects — no real-time audio analysis.
 */
export function useBeatMatch() {
  const buildNextTrack = useCallback(
    (
      currentTrack: Track,
      vibes: Playlist[],
      recentlyPlayed: Track[] = []
    ): Track | null => {
      const currentVibeId = findVibeForTrack(currentTrack, vibes);
      const currentEnergy  = getTrackEnergy(currentTrack, currentVibeId);
      const currentMood    = getTrackMood(currentTrack, currentVibeId);
      const currentTexture = getTrackTexture(currentTrack, currentVibeId);
      const currentBpm     = currentTrack.bpm ?? null;

      const recentIds = new Set(recentlyPlayed.slice(0, 20).map((t) => t.id));

      const candidates: { track: Track; vibeId: string }[] = [];
      for (const v of vibes) {
        for (const t of v.tracks) {
          if (t.id === currentTrack.id) continue;
          candidates.push({ track: t, vibeId: v.id });
        }
      }

      if (candidates.length === 0) return null;

      const scored = candidates
        .map(({ track, vibeId }) => {
          const energy  = getTrackEnergy(track, vibeId);
          const mood    = getTrackMood(track, vibeId);
          const texture = getTrackTexture(track, vibeId);

          let score = 0;

          // ── Primary: BPM proximity or energy-as-proxy ────────────────────────
          if (currentBpm != null && track.bpm != null) {
            score -= Math.abs(track.bpm - currentBpm) * 2;
          } else {
            // No BPM data for one or both tracks — use energy difference as proxy
            score -= Math.abs(energy - currentEnergy) * 10;
          }

          // ── Secondary: energy smoothness ─────────────────────────────────────
          score -= Math.abs(energy - currentEnergy) * 3;

          // ── Mood bonus ───────────────────────────────────────────────────────
          if (mood === currentMood) score += 8;

          // ── Texture bonus ────────────────────────────────────────────────────
          if (texture === currentTexture) score += 5;

          // ── Recency penalty ──────────────────────────────────────────────────
          if (recentIds.has(track.id)) score -= 40;

          // ── Tiebreaker ───────────────────────────────────────────────────────
          score += Math.random() * 4;

          return { track, score };
        })
        .sort((a, b) => b.score - a.score);

      return scored[0]?.track ?? null;
    },
    []
  );

  return { buildNextTrack };
}
