import { Track, Playlist, TrackMood, TrackTexture } from "@/data/playlists";
import {
  getTrackEnergy,
  getTrackMood,
  getTrackTexture,
  findVibeForTrack,
} from "@/lib/vibeMatch";

// ── Context ───────────────────────────────────────────────────────────────────

/** Metadata context passed to the generation provider. */
export interface GenerationContext {
  mood: TrackMood;
  energy: number;       // 1–10
  texture: TrackTexture;
  bpm: number | null;
  /** Natural-language prompt derived from context, for text-to-music APIs. */
  prompt: string;
}

/**
 * Build a GenerationContext from the currently playing track.
 * Uses only real metadata — no inference or fake values.
 */
export function buildGenerationContext(
  currentTrack: Track,
  vibes: Playlist[]
): GenerationContext {
  const vibeId  = findVibeForTrack(currentTrack, vibes);
  const mood    = getTrackMood(currentTrack, vibeId);
  const energy  = getTrackEnergy(currentTrack, vibeId);
  const texture = getTrackTexture(currentTrack, vibeId);
  const bpm     = currentTrack.bpm ?? null;

  const energyWord =
    energy <= 3 ? "calm, quiet" :
    energy <= 6 ? "moderate"   :
    "energetic, driving";
  const bpmHint = bpm ? `, around ${bpm} BPM` : "";
  const prompt  = `${mood} ${texture} music, ${energyWord}${bpmHint}`;

  return { mood, energy, texture, bpm, prompt };
}

// ── Interface ─────────────────────────────────────────────────────────────────

/**
 * Interface for a music generation provider.
 *
 * Implement this to wire in any text-to-music or AI generation API.
 * The returned Track must have a valid playable `url` (direct audio link).
 *
 * Suggested providers to implement:
 *   - Replicate MusicGen  (VITE_REPLICATE_API_TOKEN)
 *   - Suno API            (VITE_SUNO_API_KEY — when public API becomes available)
 *   - Custom Supabase Edge Function that proxies any generation backend
 *
 * @example
 * const myProvider: GenerationProvider = {
 *   name: "Replicate MusicGen",
 *   isConfigured: true,
 *   async generate(ctx) {
 *     const res = await fetch("https://api.replicate.com/v1/...", { ... });
 *     const audioUrl = await res.json(); // implementation-specific
 *     return { id: crypto.randomUUID(), title: "Generated", artist: "AI", duration: "?",
 *              url: audioUrl, energy: ctx.energy, mood: ctx.mood, texture: ctx.texture };
 *   }
 * };
 */
export interface GenerationProvider {
  /** Display name shown in logs and future UI. */
  readonly name: string;
  /**
   * True only when the provider API key / config is present and valid.
   * Check this before calling `generate` — it will be false for the null stub.
   */
  readonly isConfigured: boolean;
  /**
   * Generate a new track from the given context.
   * Returns null if generation fails or the provider is unavailable.
   * The returned track's `url` must be a direct audio URL playable by HTMLAudioElement.
   */
  generate(context: GenerationContext): Promise<Track | null>;
}

// ── Null stub ─────────────────────────────────────────────────────────────────

/**
 * Default stub — always returns null and reports isConfigured: false.
 * Used when no real provider is configured.
 */
export const nullGenerationProvider: GenerationProvider = {
  name: "None",
  isConfigured: false,
  generate: async () => null,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the active generation provider based on environment configuration.
 *
 * To add a real provider:
 *   1. Set  VITE_GENERATION_PROVIDER=<name>  in .env
 *   2. Add the provider API key   (see examples below)
 *   3. Implement the provider and return it in the switch below
 *
 * Supported provider names (not yet implemented — documented extension points):
 *
 *   "replicate"
 *     Required env:  VITE_REPLICATE_API_TOKEN=r8_...
 *     Model:         meta/musicgen  (https://replicate.com/meta/musicgen)
 *     Note:          For production, proxy through a Supabase Edge Function to
 *                    keep the token server-side.
 *
 *   "suno"
 *     Required env:  VITE_SUNO_API_KEY=...
 *     Note:          Suno public API not yet available (as of 2026).
 *                    Watch https://suno.ai for updates.
 *
 *   "supabase"
 *     Required env:  (none — uses the existing Supabase client)
 *     Note:          Deploy a `generate-music` Supabase Edge Function that
 *                    proxies any generation backend. The function receives a
 *                    GenerationContext and returns { url, title, artist, duration }.
 */
export function useGenerationProvider(): GenerationProvider {
  const providerName = import.meta.env.VITE_GENERATION_PROVIDER as string | undefined;

  if (!providerName || providerName === "none" || providerName === "") {
    return nullGenerationProvider;
  }

  // ── Extension points ───────────────────────────────────────────────────────
  // Uncomment and implement the matching block when you add a provider.
  //
  // if (providerName === "replicate") {
  //   const token = import.meta.env.VITE_REPLICATE_API_TOKEN as string | undefined;
  //   if (token) {
  //     return {
  //       name: "Replicate MusicGen",
  //       isConfigured: true,
  //       async generate(ctx) {
  //         // POST to https://api.replicate.com/v1/models/meta/musicgen/predictions
  //         // with Authorization: Token <token> and { input: { prompt: ctx.prompt } }
  //         // Poll prediction until status === "succeeded", return audio_output URL
  //         // Wrap result as a Track object with a generated id
  //         return null; // TODO: implement
  //       },
  //     };
  //   }
  // }
  //
  // if (providerName === "supabase") {
  //   return {
  //     name: "Supabase generate-music",
  //     isConfigured: true,
  //     async generate(ctx) {
  //       const { data, error } = await supabase.functions.invoke("generate-music", {
  //         body: ctx,
  //       });
  //       if (error || !data?.url) return null;
  //       return { id: crypto.randomUUID(), title: data.title ?? "Generated Track",
  //                artist: data.artist ?? "AI", duration: data.duration ?? "?",
  //                url: data.url, energy: ctx.energy, mood: ctx.mood, texture: ctx.texture };
  //     },
  //   };
  // }

  // Unknown provider name — log a warning and fall back to null
  console.warn(`[useGenerationProvider] Unknown provider "${providerName}" — set VITE_GENERATION_PROVIDER to a supported value or "none".`);
  return nullGenerationProvider;
}
