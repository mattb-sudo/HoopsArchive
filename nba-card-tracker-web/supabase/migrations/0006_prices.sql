-- =====================================================================
-- Hoops Archive -- migration 0006 : prix / valeur des cartes
-- Ajoute un prix (saisie libre par l'utilisateur, en euros) sur chaque
-- exemplaire possede -- carte de base ET parallele -- pour alimenter le
-- badge prix dans la bibliotheque et le nouvel onglet "Argent".
-- =====================================================================

begin;

alter table public.user_card_state
  add column if not exists price numeric(10,2);

alter table public.user_parallel_state
  add column if not exists price numeric(10,2);

commit;
