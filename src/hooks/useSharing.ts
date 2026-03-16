import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/** A vibe that the current user has shared. */
export interface SharedVibe {
  vibeId: string;
  shareToken: string;
  isPublic: boolean;
  createdAt: string;
  shareUrl: string;
}

/** Generate a short, URL-safe share token. */
function generateShareToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Return the full shareable URL for a given token.
 * Format: <origin>/share/<token>
 * A /share/:token route and viewer page are required to make the link land correctly.
 */
export function getShareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`;
}

export function useSharing(user: User | null) {
  const [sharedVibes, setSharedVibes] = useState<SharedVibe[]>([]);

  /**
   * Share a vibe. Returns the shareable URL.
   * If a share already exists for this vibe, returns the existing URL.
   * Only authenticated users can share.
   */
  const shareVibe = useCallback(
    async (vibeId: string): Promise<string | null> => {
      if (!user) return null;
      try {
        // Reuse existing share if present
        const { data: existing } = await supabase
          .from("shared_playlists")
          .select("share_token")
          .eq("user_id", user.id)
          .eq("vibe_id", vibeId)
          .maybeSingle();

        if (existing?.share_token) {
          return getShareUrl(existing.share_token);
        }

        const token = generateShareToken();
        const { error } = await supabase.from("shared_playlists").insert({
          user_id: user.id,
          vibe_id: vibeId,
          share_token: token,
          is_public: true,
        });

        if (error) {
          console.warn("Share vibe failed", error);
          return null;
        }

        const entry: SharedVibe = {
          vibeId,
          shareToken: token,
          isPublic: true,
          createdAt: new Date().toISOString(),
          shareUrl: getShareUrl(token),
        };
        setSharedVibes((prev) => [...prev, entry]);
        return entry.shareUrl;
      } catch (err) {
        console.warn("Share vibe failed", err);
        return null;
      }
    },
    [user]
  );

  /**
   * Revoke a share. The URL stops working once the row is deleted.
   * Ownership is enforced by the user_id filter.
   */
  const revokeShare = useCallback(
    async (vibeId: string): Promise<void> => {
      if (!user) return;
      try {
        await supabase
          .from("shared_playlists")
          .delete()
          .eq("user_id", user.id)
          .eq("vibe_id", vibeId);
        setSharedVibes((prev) => prev.filter((s) => s.vibeId !== vibeId));
      } catch (err) {
        console.warn("Revoke share failed", err);
      }
    },
    [user]
  );

  /** Load all active shares for the current user from the database. */
  const loadShares = useCallback(async (): Promise<void> => {
    if (!user) { setSharedVibes([]); return; }
    try {
      const { data } = await supabase
        .from("shared_playlists")
        .select("vibe_id, share_token, is_public, created_at")
        .eq("user_id", user.id);

      if (data) {
        setSharedVibes(
          data
            .filter((d) => d.share_token)
            .map((d) => ({
              vibeId: d.vibe_id,
              shareToken: d.share_token!,
              isPublic: d.is_public ?? true,
              createdAt: d.created_at ?? new Date().toISOString(),
              shareUrl: getShareUrl(d.share_token!),
            }))
        );
      }
    } catch (err) {
      console.warn("Load shares failed", err);
    }
  }, [user]);

  return { sharedVibes, shareVibe, revokeShare, loadShares };
}
