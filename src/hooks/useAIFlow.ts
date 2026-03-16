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
}

export function useAIFlow() {
  const sinceLastBridgeRef = useRef(0);

  const buildNextTrack = useCallback(
    (currentTrack: Track, vibes: Playlist[], recentlyPlayed: Track[] = []): AIFlowQueueItem | null => {
      const currentVibeId = findVibeForTrack(currentTrack, vibes);
      const currentEnergy = getTrackEnergy(currentTrack, currentVibeId);
      const currentMood = getTrackMood(currentTrack, currentVibeId);
      const currentTexture = getTrackTexture(currentTrack, currentVibeId);

      // Build set of recently played track IDs (last 30) to avoid repeats
      const recentIds = new Set(recentlyPlayed.slice(0, 30).map((t) => t.id));

      // Gather all candidate tracks (excluding current and classical bridges for normal selection)
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

      // Check if we need a bridge: big energy jump or texture/mood shift
      const needsBridge =
        sinceLastBridgeRef.current >= 3 && // at least 3 songs since last bridge
        bridgeTracks.length > 0;

      // Score candidates
      const scored = allTracks
        .filter(({ track, vibeId }) => {
          // Don't pick bridge tracks as normal tracks if they're bridge-only
          if (vibeId === "classical" && isBridgeCandidate(track)) return false;
          return true;
        })
        .map(({ track, vibeId }) => {
          const energy = getTrackEnergy(track, vibeId);
          const mood = getTrackMood(track, vibeId);
          const texture = getTrackTexture(track, vibeId);

          let score = 100;

          // Energy difference penalty — prefer smooth transitions
          const energyDiff = Math.abs(energy - currentEnergy);
          score -= energyDiff * 12;

          // Mood continuity bonus
          if (mood === currentMood) score += 15;

          // Texture similarity bonus
          if (texture === currentTexture) score += 10;

          // Recently played penalty — strongly avoid repeats
          if (recentIds.has(track.id)) score -= 60;

          // Soft landing: if current energy is high (>=8) and we've been intense, favor slightly lower
          if (currentEnergy >= 8 && sinceLastBridgeRef.current >= 2) {
            if (energy < currentEnergy && energy >= currentEnergy - 3) score += 8;
          }

          // Randomness factor
          score += Math.random() * 20;

          return { track, score, energyDiff };
        })
        .sort((a, b) => b.score - a.score);

      // Decide: insert bridge or pick best candidate
      const bestCandidate = scored[0];

      if (
        needsBridge &&
        bestCandidate &&
        bestCandidate.energyDiff >= 4
      ) {
        // Insert a classical bridge
        const bridge = bridgeTracks[Math.floor(Math.random() * bridgeTracks.length)];
        sinceLastBridgeRef.current = 0;
        return { track: bridge, isBridge: true };
      }

      if (bestCandidate) {
        sinceLastBridgeRef.current += 1;
        return { track: bestCandidate.track, isBridge: false };
      }

      // Fallback: pick any track
      const fallback = allTracks[Math.floor(Math.random() * allTracks.length)];
      sinceLastBridgeRef.current += 1;
      return { track: fallback.track, isBridge: false };
    },
    []
  );

  const resetFlow = useCallback(() => {
    sinceLastBridgeRef.current = 0;
  }, []);

  return { buildNextTrack, resetFlow };
}
