-- Fix user_tracks unique constraint.
--
-- The previous constraint UNIQUE(user_id, track_id) prevents the same track
-- from appearing in more than one vibe per user. This is wrong: a user should
-- be able to add the same track to multiple vibes (e.g., a favourite song
-- that fits both "80s" and "pop").
--
-- The correct constraint is (user_id, vibe_id, track_id): unique per vibe,
-- not globally unique per user.

-- Drop the incorrect constraint
ALTER TABLE public.user_tracks
  DROP CONSTRAINT IF EXISTS user_tracks_user_id_track_id_key;

-- Add the correct constraint
ALTER TABLE public.user_tracks
  ADD CONSTRAINT user_tracks_user_id_vibe_id_track_id_key
  UNIQUE (user_id, vibe_id, track_id);
