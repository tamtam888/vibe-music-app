
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User vibes
CREATE TABLE public.user_vibes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vibe_id text NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🎵',
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vibe_id)
);
ALTER TABLE public.user_vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own vibes" ON public.user_vibes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User tracks
CREATE TABLE public.user_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vibe_id text NOT NULL,
  track_id text NOT NULL,
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'Unknown Artist',
  duration text NOT NULL DEFAULT '',
  url text NOT NULL,
  energy int,
  mood text,
  texture text,
  is_bridge boolean DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, track_id)
);
ALTER TABLE public.user_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own tracks" ON public.user_tracks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User settings
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  shuffle boolean DEFAULT false,
  ai_flow boolean DEFAULT false,
  language text DEFAULT 'en',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Playlists table for future sharing
CREATE TABLE public.shared_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vibe_id text NOT NULL,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.shared_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own shared playlists" ON public.shared_playlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
