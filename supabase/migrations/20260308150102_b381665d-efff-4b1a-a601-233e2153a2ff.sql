
CREATE TABLE public.favorite_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id text NOT NULL,
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'Unknown Artist',
  duration text NOT NULL DEFAULT '',
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, track_id),
  CONSTRAINT fk_favorite_tracks_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.recently_played (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id text NOT NULL,
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'Unknown Artist',
  duration text NOT NULL DEFAULT '',
  url text NOT NULL,
  played_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_recently_played_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.resume_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  track_id text NOT NULL,
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'Unknown Artist',
  duration text NOT NULL DEFAULT '',
  url text NOT NULL,
  position_seconds float DEFAULT 0,
  playlist_json text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_resume_state_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.favorite_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_played ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own favorites" ON public.favorite_tracks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users CRUD own recently played" ON public.recently_played FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users CRUD own resume state" ON public.resume_state FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
