-- =====================================================================
-- NBA Card Tracker — migration 0001 : schema, RLS, storage
-- A executer dans Supabase > SQL Editor (ou via `supabase db push`).
-- Ce script est ecrit pour pouvoir etre relance sans casser l'existant.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Donnees de reference (lecture publique)
-- ---------------------------------------------------------------------

create table if not exists public.sets (
  id            text primary key,
  name          text not null,
  manufacturer  text,
  release_date  date,
  base_count    int
);

create table if not exists public.subsets (
  id      text not null,
  set_id  text not null references public.sets (id) on delete cascade,
  name    text not null,
  type    text not null check (type in ('base', 'insert', 'autograph')),
  primary key (set_id, id)
);

create table if not exists public.cards (
  set_id        text not null references public.sets (id) on delete cascade,
  card_code     text not null,
  subset        text,
  player        text,
  team          text,
  player_id     text,
  team_id       text,
  season        text,
  rookie        boolean not null default false,
  variant       text,
  jersey_number text,
  primary key (set_id, card_code)
);

-- Index utilises par les "focus" (joueur / equipe / equipe+saison)
create index if not exists cards_player_id_idx on public.cards (player_id);
create index if not exists cards_team_id_idx   on public.cards (team_id);
create index if not exists cards_subset_idx    on public.cards (set_id, subset);

-- Table d'association carte <-> joueur.
-- Necessaire parce que certaines cartes de la checklist (autographes "Rookie
-- Duals" HRD, "Rookie Triples" HRT, "Rookie/Veteran Duos" RVD) portent UN SEUL
-- numero de carte pour 2 ou 3 joueurs. La table `cards` a pour cle primaire
-- (set_id, card_code) : elle ne peut donc contenir qu'une ligne par numero.
-- `card_players` conserve les 725 associations joueur/carte du fichier source
-- et sert au matching des focus, afin qu'un focus "joueur" retrouve aussi les
-- cartes doubles/triples ou ce joueur apparait en 2e ou 3e position.
create table if not exists public.card_players (
  set_id    text not null,
  card_code text not null,
  slot      int  not null default 1,
  player    text not null,
  player_id text not null,
  team      text,
  team_id   text,
  season    text,
  primary key (set_id, card_code, slot),
  foreign key (set_id, card_code) references public.cards (set_id, card_code) on delete cascade
);

create index if not exists card_players_player_id_idx on public.card_players (player_id);
create index if not exists card_players_team_id_idx   on public.card_players (team_id, season);

-- ---------------------------------------------------------------------
-- 2. Donnees utilisateur
-- ---------------------------------------------------------------------

-- `variant` et `jersey_number` sont ici, et non dans `cards`, parce que `cards`
-- est une donnee de reference strictement en lecture seule pour le role
-- `authenticated` (voir la section RLS). Ce sont des valeurs saisies par
-- l'utilisateur sur la fiche d'une carte ; l'application affiche la valeur
-- utilisateur en priorite, puis celle de la checklist.
create table if not exists public.user_card_state (
  user_id       uuid not null references auth.users (id) on delete cascade,
  set_id        text not null,
  card_code     text not null,
  owned         boolean not null default false,
  qty           int not null default 0,
  note          text,
  photo_path    text,
  variant       text,
  jersey_number text,
  date_added    timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, set_id, card_code),
  foreign key (set_id, card_code) references public.cards (set_id, card_code) on delete cascade
);

-- Ajout non destructif si la table existait deja sans ces colonnes.
alter table public.user_card_state add column if not exists variant text;
alter table public.user_card_state add column if not exists jersey_number text;

create index if not exists user_card_state_owned_idx on public.user_card_state (user_id, owned);
create index if not exists user_card_state_date_idx  on public.user_card_state (user_id, date_added desc);

create table if not exists public.focuses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null check (type in ('player', 'team', 'team_season')),
  value      text not null,
  label      text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists focuses_user_idx on public.focuses (user_id, active);

create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  pseudonym   text,
  avatar_seed text,
  prefs       jsonb not null default '{"defaultView":"grid","theme":"light"}'::jsonb
);

-- ---------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------

-- updated_at toujours a jour sur user_card_state
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_card_state_touch on public.user_card_state;
create trigger user_card_state_touch
  before update on public.user_card_state
  for each row execute function public.touch_updated_at();

-- Creation automatique d'un profil vierge a l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, pseudonym, avatar_seed)
  values (new.id, 'Collectionneur', 'basketball')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rattrapage : profil pour les comptes deja existants
insert into public.profiles (user_id, pseudonym, avatar_seed)
select id, 'Collectionneur', 'basketball' from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------
-- 4. RLS — donnees de reference : lecture seule pour tout le monde
-- ---------------------------------------------------------------------

alter table public.sets         enable row level security;
alter table public.subsets      enable row level security;
alter table public.cards        enable row level security;
alter table public.card_players enable row level security;

drop policy if exists "sets_public_read" on public.sets;
create policy "sets_public_read" on public.sets
  for select to anon, authenticated using (true);

drop policy if exists "subsets_public_read" on public.subsets;
create policy "subsets_public_read" on public.subsets
  for select to anon, authenticated using (true);

drop policy if exists "cards_public_read" on public.cards;
create policy "cards_public_read" on public.cards
  for select to anon, authenticated using (true);

drop policy if exists "card_players_public_read" on public.card_players;
create policy "card_players_public_read" on public.card_players
  for select to anon, authenticated using (true);

-- Aucune policy insert/update/delete sur ces 4 tables : elles sont en lecture
-- seule pour anon et authenticated. Le seed se fait avec le role postgres
-- (SQL Editor / migrations), qui contourne la RLS.

-- ---------------------------------------------------------------------
-- 5. RLS — donnees utilisateur : chacun ne voit que ses lignes
-- ---------------------------------------------------------------------

alter table public.user_card_state enable row level security;
alter table public.focuses         enable row level security;
alter table public.profiles        enable row level security;

drop policy if exists "user_card_state_select_own" on public.user_card_state;
create policy "user_card_state_select_own" on public.user_card_state
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "user_card_state_insert_own" on public.user_card_state;
create policy "user_card_state_insert_own" on public.user_card_state
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "user_card_state_update_own" on public.user_card_state;
create policy "user_card_state_update_own" on public.user_card_state
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "user_card_state_delete_own" on public.user_card_state;
create policy "user_card_state_delete_own" on public.user_card_state
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "focuses_select_own" on public.focuses;
create policy "focuses_select_own" on public.focuses
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "focuses_insert_own" on public.focuses;
create policy "focuses_insert_own" on public.focuses
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "focuses_update_own" on public.focuses;
create policy "focuses_update_own" on public.focuses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "focuses_delete_own" on public.focuses;
create policy "focuses_delete_own" on public.focuses
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 6. Storage — bucket prive "card-photos"
--    Chemin des objets : <user_id>/<set_id>/<card_code>
--    Chaque utilisateur n'a acces qu'au dossier portant son propre uid.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-photos',
  'card-photos',
  false,
  10485760, -- 10 Mo
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "card_photos_read_own" on storage.objects;
create policy "card_photos_read_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'card-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "card_photos_insert_own" on storage.objects;
create policy "card_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'card-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "card_photos_update_own" on storage.objects;
create policy "card_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'card-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'card-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "card_photos_delete_own" on storage.objects;
create policy "card_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'card-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
