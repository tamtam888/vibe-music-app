import { useCallback, useRef } from "react";
import { Track, Playlist } from "@/data/playlists";
import {
  getTrackEnergy,
  getTrackMood,
  getTrackTexture,
  findVibeForTrack,
  isBridgeCandidate,
} from "@/lib/vibeMatch";

export interface AIFlowQueueItem {
  track: Track;
  isBridge: boolean;
  /** Human-readable explanation of why this track was selected. */
  matchReason: string;
}

/** Group a BPM value into a broad tempo band for compatibility checks. */
function bpmBand(bpm: number): "slow" | "medium" | "fast" {
  if (bpm < 90) return "slow";
  if (bpm < 120) return "medium";
  return "fast";
}

export function useAIFlow() {
  const sinceLastBridgeRef = useRef(0);

  const buildNextTrack = useCallback(
    (
      currentTrack: Track,
      vibes: Playlist[],
      recentlyPlayed: Track[] = [],
      favoritedIds: Set<string> = new Set()
    ): AIFlowQueueItem | null => {
      const currentVibeId = findVibeForTrack(currentTrack, vibes);
      const currentEnergy  = getTrackEnergy(currentTrack, currentVibeId);
      const currentMood    = getTrackMood(currentTrack, currentVibeId);
      const currentTexture = getTrackTexture(currentTrack, currentVibeId);
      const currentBpm     = currentTrack.bpm ?? null;

      // Tiered recency windows — slice(-N) takes the N most recently played tracks
      // (playedTracks grows newest-last, so slice(0, N) would penalise the wrong end).
      const veryRecentIds = new Set(recentlyPlayed.slice(-5).map((t) => t.id));
      const recentIds     = new Set(recentlyPlayed.slice(-30).map((t) => t.id));

      // Gather all candidate tracks (bridge-only classical tracks are separated)
      const allTracks: { track: Track; vibeId: string }[] = [];
      const bridgeTracks: Track[] = [];

      for (const v of vibes) {
        for (const t of v.tracks) {
          if (t.id === currentTrack.id) continue;
          if (v.id === "classical" && isBridgeCandidate(t)) {
            bridgeTracks.push(t);
          }
          allTracks.push({ track: t, vibeId: v.id });
        }
      }

      if (allTracks.length === 0) return null;

      // Bridge needed after 3+ non-bridge tracks with a large energy jump.
      // Only fire when coming FROM higher energy — classical bridges calm things
      // down; they should not precede an upward energy transition.
      const needsBridge =
        sinceLastBridgeRef.current >= 3 &&
        bridgeTracks.length > 0 &&
        currentEnergy >= 5;

      // ── Score every non-bridge candidate ──────────────────────────────────────
      const scored = allTracks
        .filter(({ track, vibeId }) => {
          if (vibeId === "classical" && isBridgeCandidate(track)) return false;
          return true;
        })
        .map(({ track, vibeId }) => {
          const energy  = getTrackEnergy(track, vibeId);
          const mood    = getTrackMood(track, vibeId);
          const texture = getTrackTexture(track, vibeId);

          let score = 100;
          const reasons: string[] = [];

          // ── Energy smoothness (primary signal) ──────────────────────────────
          const energyDiff = Math.abs(energy - currentEnergy);
          score -= energyDiff * 12;
          if (energyDiff <= 1) reasons.push("Energy flow");

          // ── BPM proximity ────────────────────────────────────────────────────
          if (track.bpm != null && currentBpm != null) {
            const bpmDiff = Math.abs(track.bpm - currentBpm);
            // Gentle per-unit penalty so small differences matter little
            score -= bpmDiff * 0.3;
            // Bonus for matching tempo band (slow / medium / fast)
            if (bpmBand(track.bpm) === bpmBand(currentBpm)) {
              score += 10;
              // Show actual BPM in the match reason when close enough to be meaningful
              if (bpmDiff < 15) reasons.push(`${track.bpm} BPM`);
            }
          }

          // ── Mood continuity ─────────────────────────────────────────────────
          if (mood === currentMood) {
            score += 20;
            reasons.push("Mood");
          }

          // ── Texture similarity ──────────────────────────────────────────────
          if (texture === currentTexture) {
            score += 15;
            reasons.push("Texture");
          }

          // ── Same-vibe soft gravity ───────────────────────────────────────────
          // Gentle pull toward the current vibe so sessions feel coherent without
          // locking the algorithm into one vibe indefinitely.
          if (currentVibeId && vibeId === currentVibeId) {
            score += 8;
            if (reasons.length === 0) reasons.push("Vibe");
          }

          // ── Tiered recency penalty — strongly avoid recent repeats ───────────
          if (veryRecentIds.has(track.id)) score -= 80;
          else if (recentIds.has(track.id)) score -= 60;

          // ── Favorites bonus ─────────────────────────────────────────────────
          if (favoritedIds.has(track.id)) {
            score += 25;
            reasons.push("Favorite");
          }

          // ── Soft landing: ease down from a high-energy run ──────────────────
          if (currentEnergy >= 8 && sinceLastBridgeRef.current >= 2) {
            if (energy < currentEnergy && energy >= currentEnergy - 3) score += 8;
          }

          // ── Tiebreaker — kept small so it never overrides real signal ────────
          score += Math.random() * 4;

          const matchReason = reasons.length > 0
            ? reasons.join(" · ")
            : "Best available match";

          return { track, score, energyDiff, matchReason };
        })
        .sort((a, b) => b.score - a.score);

      const bestCandidate = scored[0];

      // Insert a classical bridge if energy jump is large and we've played enough.
      if (needsBridge && bestCandidate && bestCandidate.energyDiff >= 4) {
        const bridge = bridgeTracks[Math.floor(Math.random() * bridgeTracks.length)];
        sinceLastBridgeRef.current = 0;
        return { track: bridge, isBridge: true, matchReason: "Bridge transition" };
      }

      if (bestCandidate) {
        sinceLastBridgeRef.current += 1;
        return {
          track: bestCandidate.track,
          isBridge: false,
          matchReason: bestCandidate.matchReason,
        };
      }

      // Last resort: pick any available track (scored array was empty after bridge filter)
      const fallback = allTracks[Math.floor(Math.random() * allTracks.length)];
      sinceLastBridgeRef.current += 1;
      return { track: fallback.track, isBridge: false, matchReason: "Best available match" };
    },
    []
  );

  const resetFlow = useCallback(() => {
    sinceLastBridgeRef.current = 0;
  }, []);

  return { buildNextTrack, resetFlow };
}
