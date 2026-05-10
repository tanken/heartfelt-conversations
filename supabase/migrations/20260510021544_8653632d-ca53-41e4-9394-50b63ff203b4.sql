ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS share_token text UNIQUE;
ALTER TABLE public.session_players ADD COLUMN IF NOT EXISTS avatar_key text;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS avatar_key text;