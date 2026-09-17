/** Types applicatifs, alignes sur le schema SQL (supabase/migrations). */

export type SubsetType = "base" | "insert" | "autograph";
export type FocusType = "player" | "team" | "team_season";
export type ViewMode = "grid" | "list";
export type Theme = "light" | "dark";

export interface SetRow {
  id: string;
  name: string;
  manufacturer: string | null;
  release_date: string | null;
  base_count: number | null;
}

export interface SubsetRow {
  id: string;
  set_id: string;
  name: string;
  type: SubsetType;
}

export interface CardRow {
  set_id: string;
  card_code: string;
  subset: string | null;
  player: string | null;
  team: string | null;
  player_id: string | null;
  team_id: string | null;
  season: string | null;
  rookie: boolean;
  variant: string | null;
  jersey_number: string | null;
}

export interface ParallelRow {
  set_id: string;
  id: string;
  name: string;
  format: string | null;
  numbered: number | null;
}

/** Etat de possession de l'utilisateur pour un parallele donne d'une carte. */
export interface UserParallelStateRow {
  user_id: string;
  set_id: string;
  card_code: string;
  parallel_id: string;
  owned: boolean;
  qty: number;
  note: string | null;
  photo_path: string | null;
  /** Photo du verso, optionnelle : si les deux photos existent, la carte se retourne au survol. */
  photo_back_path: string | null;
  /** Prix/valeur saisi librement par l'utilisateur, en euros, propre a CET exemplaire. */
  price: number | null;
  date_added: string | null;
  updated_at: string;
}

/** Un parallele du catalogue, enrichi de l'etat de possession sur une carte precise. */
export interface ParallelWithState extends ParallelRow {
  owned: boolean;
  qty: number;
  date_added: string | null;
  photo_path: string | null;
  photo_back_path: string | null;
  /** Info libre propre a CET exemplaire (nom perso, cote, provenance...). */
  note: string | null;
  /** Prix/valeur saisi librement par l'utilisateur, en euros, propre a CET exemplaire. */
  price: number | null;
  /** URLs signees pretes a afficher (calculees en lot cote serveur). */
  photo_url?: string | null;
  photo_back_url?: string | null;
}

export interface CardPlayerRow {
  set_id: string;
  card_code: string;
  slot: number;
  player: string;
  player_id: string;
  team: string | null;
  team_id: string | null;
  season: string | null;
}

export interface UserCardStateRow {
  user_id: string;
  set_id: string;
  card_code: string;
  owned: boolean;
  qty: number;
  note: string | null;
  photo_path: string | null;
  /** Photo du verso, optionnelle : si les deux photos existent, la carte se retourne au survol. */
  photo_back_path: string | null;
  /** Prix/valeur saisi librement par l'utilisateur, en euros. */
  price: number | null;
  /** Saisie utilisateur : prioritaire sur cards.variant. */
  variant: string | null;
  /** Saisie utilisateur : prioritaire sur cards.jersey_number. */
  jersey_number: string | null;
  date_added: string | null;
  updated_at: string;
}

export interface FocusRow {
  id: string;
  user_id: string;
  type: FocusType;
  value: string;
  label: string;
  active: boolean;
  created_at: string;
}

export interface Prefs {
  defaultView: ViewMode;
  theme: Theme;
  /** Les blocs de cartes (par sous-ensemble/set) demarrent replies si true. */
  collapseSectionsByDefault: boolean;
}

export interface ProfileRow {
  user_id: string;
  pseudonym: string | null;
  avatar_seed: string | null;
  prefs: Prefs;
}

/** Une carte enrichie de l'etat de collection de l'utilisateur. */
export interface CardWithState extends CardRow {
  set_name: string | null;
  owned: boolean;
  qty: number;
  note: string | null;
  photo_path: string | null;
  /** Photo du verso, optionnelle : si les deux photos existent, la carte se retourne au survol. */
  photo_back_path: string | null;
  /** Prix/valeur saisi librement par l'utilisateur, en euros. */
  price: number | null;
  date_added: string | null;
  /** URLs signees pretes a afficher, calculees en lot cote serveur (voir `attachPhotoUrls`). */
  photo_url?: string | null;
  photo_back_url?: string | null;
  /**
   * Presente uniquement sur les entrees "virtuelles" generees pour un
   * parallele coche sur la fiche carte (voir `getOwnedParallelInstances`).
   * Une carte normale possedee + un parallele coche de la meme carte donnent
   * ainsi 2 entrees distinctes et cumulables dans les grilles/compteurs.
   */
  parallel?: { id: string; name: string; numbered: number | null } | null;
}

export interface Progress {
  owned: number;
  total: number;
  pct: number;
}

export interface SetProgress extends Progress {
  set: SetRow;
}

export interface FocusProgress extends Progress {
  focus: FocusRow;
  cards: CardWithState[];
}

/** Statut de filtrage partage par le classeur, les focus et la recherche. */
export type StatusFilter = "all" | "owned" | "missing" | "duplicates";

export const STATUS_FILTERS: StatusFilter[] = ["all", "owned", "missing", "duplicates"];

export function parseStatusFilter(value: string | undefined | null): StatusFilter {
  return STATUS_FILTERS.includes(value as StatusFilter) ? (value as StatusFilter) : "all";
}

export const DEFAULT_PREFS: Prefs = {
  defaultView: "grid",
  theme: "light",
  collapseSectionsByDefault: true,
};

export function normalizePrefs(value: unknown): Prefs {
  const raw = (value ?? {}) as Partial<Prefs>;
  return {
    defaultView: raw.defaultView === "list" ? "list" : "grid",
    theme: raw.theme === "dark" ? "dark" : "light",
    collapseSectionsByDefault: raw.collapseSectionsByDefault !== false,
  };
}
