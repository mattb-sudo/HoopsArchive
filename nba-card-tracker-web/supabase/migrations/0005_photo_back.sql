-- =====================================================================
-- Hoops Archive -- migration 0005 : photo du verso de la carte
-- Ajoute une 2e photo (verso) en plus de la photo existante (recto), pour
-- les cartes normales ET les parallèles. Quand les deux sont renseignées,
-- l'interface fait un effet de retournement au survol.
-- =====================================================================

begin;

alter table public.user_card_state
  add column if not exists photo_back_path text;

alter table public.user_parallel_state
  add column if not exists photo_back_path text;

commit;
