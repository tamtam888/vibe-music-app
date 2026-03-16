
CREATE TABLE public.saved_mixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  mix_type text NOT NULL DEFAULT 'manual',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_saved_mixes_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.saved_mix_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mix_id uuid NOT NULL REFERENCES public.saved_mixes(id) ON DELETE CASCADE,
  track_id text NOT NULL,
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'Unknown Artist',
  duration text NOT NULL DEFAULT '',
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_bridge boolean DEFAULT false
);

ALTER TABLE public.saved_mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_mix_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own mixes" ON public.saved_mixes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users CRUD own mix tracks" ON public.saved_mix_tracks FOR ALL TO authenticated
  USING (mix_id IN (SELECT id FROM public.saved_mixes WHERE user_id = auth.uid()))
  WITH CHECK (mix_id IN (SELECT id FROM public.saved_mixes WHERE user_id = auth.uid()));
