import { Track } from "@/data/playlists";

/**
 * Interface for an external music discovery provider.
 * Implement this to plug in Spotify, Last.fm, or any other service
 * that can suggest a next track based on what's currently playing.
 *
 * Usage:
 *   const myProvider: DiscoverProvider = { ... };
 *   // Pass it to handleAIFlowNext or store it in a context.
 */
export interface DiscoverProvider {
  /** Human-readable name shown in the UI (e.g. "Spotify", "Last.fm"). */
  readonly name: string;
  /** Whether the provider is authenticated and ready to serve results. */
  readonly isConnected: boolean;
  /**
   * Given the currently playing track, return a suggested next track,
   * or null if no suggestion is available.
   */
  findNext(currentTrack: Track): Promise<Track | null>;
}

/**
 * Stub provider used when no real external provider is configured.
 * Always reports not connected and returns null from findNext.
 */
export const nullDiscoverProvider: DiscoverProvider = {
  name: "None",
  isConnected: false,
  findNext: async () => null,
};
