
-- Decks
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Cards
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  layer int not null check (layer between 1 and 5),
  prompt text not null,
  created_at timestamptz not null default now()
);
create index cards_deck_layer_idx on public.cards(deck_id, layer);

-- Sessions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text unique,
  deck_id uuid not null references public.decks(id),
  mode text not null check (mode in ('solo','local','room','async')),
  status text not null default 'active' check (status in ('active','closed')),
  current_layer int not null default 1,
  current_card_id uuid references public.cards(id),
  current_player_id uuid,
  host_name text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index sessions_room_code_idx on public.sessions(room_code);

-- Session players
create table public.session_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  display_name text not null,
  turn_order int not null default 0,
  joined_at timestamptz not null default now()
);
create index session_players_session_idx on public.session_players(session_id);

-- Answers
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  card_id uuid not null references public.cards(id),
  player_id uuid references public.session_players(id) on delete set null,
  player_name text not null,
  layer int not null,
  text text not null,
  is_shared boolean not null default false,
  is_reflection boolean not null default false,
  is_spiral boolean not null default false,
  created_at timestamptz not null default now()
);
create index answers_session_idx on public.answers(session_id, created_at);
create index answers_shared_idx on public.answers(id) where is_shared = true;

-- RLS
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.sessions enable row level security;
alter table public.session_players enable row level security;
alter table public.answers enable row level security;

-- Public read for decks/cards
create policy "decks readable by all" on public.decks for select using (true);
create policy "cards readable by all" on public.cards for select using (true);

-- Sessions: anyone can read, create, update (guest-friendly rooms by code)
create policy "sessions readable by all" on public.sessions for select using (true);
create policy "sessions insertable by all" on public.sessions for insert with check (true);
create policy "sessions updatable by all" on public.sessions for update using (true);

-- Players
create policy "players readable by all" on public.session_players for select using (true);
create policy "players insertable by all" on public.session_players for insert with check (true);
create policy "players updatable by all" on public.session_players for update using (true);

-- Answers
create policy "answers readable by all" on public.answers for select using (true);
create policy "answers insertable by all" on public.answers for insert with check (true);
create policy "answers updatable by all" on public.answers for update using (true);

-- Realtime
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.session_players;
alter publication supabase_realtime add table public.answers;

-- Seed Core deck
insert into public.decks (slug, name, description) values
  ('core', 'The Spiral — Core Deck', 'A journey from playful surface to soul-deep truth.');
