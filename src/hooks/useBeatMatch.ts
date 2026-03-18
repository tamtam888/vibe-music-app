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
 * Scoring:
 *   Primary   — BPM proximity: −2 pts per BPM unit of difference
 *               Falls back to energy proximity (−10 per unit) when BPM missing
 *   Secondary — energy proximity: −3 pts per unit (always applied)
 *   Bonus     — mood match: +8 pts
 *   Bonus     — texture match: +5 pts
 *   Bonus     — same-vibe continuity: +15 pts
 *   Penalty   — very recent (last 5): −80 pts
 *   Penalty   — moderately recent (last 20): −40 pts
 *   Tiebreak  — small random nudge: 0–4 pts
 *
 * Returns a BeatMatchResult with a match reason for display in the UI.
 * Uses only static metadata — no real-time audio analysis.
 */
export interface BeatMatchResult {
  track: Track;
  matchReason: string;
}

export function useBeatMatch() {
  const buildNextTrack = useCallback(
    (
      currentTrack: Track,
      vibes: Playlist[],
      recentlyPlayed: Track[] = []
    ): BeatMatchResult | null => {
      const currentVibeId = findVibeForTrack(currentTrack, vibes);
      const currentEnergy  = getTrackEnergy(currentTrack, currentVibeId);
      const currentMood    = getTrackMood(currentTrack, currentVibeId);
      const currentTexture = getTrackTexture(currentTrack, currentVibeId);
      const currentBpm     = currentTrack.bpm ?? null;

      // Tiered recency windows — slice(-N) takes the N most recently played tracks
      // (playedTracks grows newest-last).
      const veryRecentIds = new Set(recentlyPlayed.slice(-5).map((t) => t.id));
      const recentIds     = new Set(recentlyPlayed.slice(-20).map((t) => t.id));

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
          const reasons: string[] = [];

          let score = 0;

          // ── Primary: BPM proximity or energy-as-proxy ────────────────────────
          const hasBpm = currentBpm != null && track.bpm != null;
          if (hasBpm) {
            const bpmDiff = Math.abs(track.bpm! - currentBpm!);
            score -= bpmDiff * 2;
            if (bpmDiff < 15) reasons.push(`${track.bpm} BPM`);
          } else {
            // No BPM data — use energy difference as proxy
            score -= Math.abs(energy - currentEnergy) * 10;
          }

          // ── Secondary: energy smoothness ─────────────────────────────────────
          score -= Math.abs(energy - currentEnergy) * 3;

          // ── Mood bonus ───────────────────────────────────────────────────────
          if (mood === currentMood) { score += 8; reasons.push("Mood"); }

          // ── Texture bonus ────────────────────────────────────────────────────
          if (texture === currentTexture) { score += 5; reasons.push("Texture"); }

          // ── Same-vibe continuity ─────────────────────────────────────────────
          // Prefer staying within the active vibe before jumping to another one.
          if (currentVibeId && vibeId === currentVibeId) { score += 15; reasons.push("Vibe"); }

          // ── Tiered recency penalty ───────────────────────────────────────────
          // Very recent (last 5): heavy penalty to break tight repeat loops.
          // Moderately recent (last 20): lighter penalty to discourage stale revisits.
          if (veryRecentIds.has(track.id)) score -= 80;
          else if (recentIds.has(track.id)) score -= 40;

          // ── Tiebreaker ───────────────────────────────────────────────────────
          score += Math.random() * 4;

          const matchReason = reasons.length > 0 ? reasons.join(" · ") : hasBpm ? "Best BPM match" : "Energy match";
          return { track, score, matchReason };
        })
        .sort((a, b) => b.score - a.score);

      return scored[0]
        ? { track: scored[0].track, matchReason: scored[0].matchReason }
        : null;
    },
    []
  );

  return { buildNextTrack };
}
