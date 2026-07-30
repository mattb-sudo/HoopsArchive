import type {
  CardWithState,
  Progress,
  StatusFilter,
  SubsetRow,
  SubsetType,
} from "./types";

/**
 * Ordre d'affichage des sous-ensembles dans le classeur :
 * base, puis highlights, puis all-star, puis les inserts et autographes.
 */
const EXPLICIT_SUBSET_ORDER = ["base", "highlights", "all-star"];

export function subsetRank(subsetId: string | null, type?: SubsetType | null): number {
  const explicit = EXPLICIT_SUBSET_ORDER.indexOf(subsetId ?? "");
  if (explicit >= 0) return explicit;
  if (type === "base") return 10;
  if (type === "insert") return 20;
  if (type === "autograph") return 30;
  return 40;
}

export function sortSubsets(subsets: SubsetRow[]): SubsetRow[] {
  return [...subsets].sort((a, b) => {
    const ra = subsetRank(a.id, a.type);
    const rb = subsetRank(b.id, b.type);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, "fr");
  });
}

/**
 * Tri "par numero" : les cartes numerotees (1, 2, 3...) d'abord dans l'ordre
 * numerique, puis les codes alphanumeriques (HS-AE, FP-12...) par ordre
 * alphabetique puis numerique du suffixe.
 */
export function compareCardCode(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = Number.isFinite(na);
  const bNum = Number.isFinite(nb);
  if (aNum && bNum) return na - nb;
  if (aNum) return -1;
  if (bNum) return 1;
  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
}

export type SortMode = "number" | "name" | "team";

export const SORT_LABELS: Record<SortMode, string> = {
  number: "Numéro",
  name: "Joueur",
  team: "Équipe",
};

export function sortCards(cards: CardWithState[], mode: SortMode): CardWithState[] {
  const copy = [...cards];
  if (mode === "name") {
    copy.sort(
      (a, b) =>
        (a.player ?? "").localeCompare(b.player ?? "", "fr") ||
        compareCardCode(a.card_code, b.card_code),
    );
  } else if (mode === "team") {
    copy.sort(
      (a, b) =>
        (a.team ?? "").localeCompare(b.team ?? "", "fr") ||
        compareCardCode(a.card_code, b.card_code),
    );
  } else {
    copy.sort((a, b) => compareCardCode(a.card_code, b.card_code));
  }
  return copy;
}

export function matchesStatus(card: CardWithState, status: StatusFilter): boolean {
  switch (status) {
    case "owned":
      return card.owned;
    case "missing":
      return !card.owned;
    case "duplicates":
      return card.qty > 1;
    default:
      return true;
  }
}

/** Recherche texte locale (joueur, equipe, numero, sous-ensemble, set). */
export function matchesQuery(card: CardWithState, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [card.player, card.team, card.card_code, card.subset, card.set_name]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
}

export function progressOf(cards: CardWithState[]): Progress {
  const total = cards.length;
  const owned = cards.filter((c) => c.owned).length;
  return { owned, total, pct: total === 0 ? 0 : Math.round((owned / total) * 100) };
}

export function duplicateCount(cards: CardWithState[]): number {
  return cards.filter((c) => c.qty > 1).length;
}

/** Nombre total d'exemplaires en trop (somme des qty - 1). */
export function duplicateCopies(cards: CardWithState[]): number {
  return cards.reduce((sum, c) => sum + Math.max(0, c.qty - 1), 0);
}

/** Rarete d'un sous-ensemble : autographe > insert > base. */
export function rarityRank(type: SubsetType | undefined): number {
  if (type === "autograph") return 3;
  if (type === "insert") return 2;
  return 1;
}

/**
 * "Carte la plus rare possedee" : on privilegie le type de sous-ensemble
 * (autographe > insert > base), puis le sous-ensemble le moins nombreux.
 */
export function rarestOwnedCard(
  cards: CardWithState[],
  subsets: SubsetRow[],
): CardWithState | null {
  const typeBySubset = new Map(subsets.map((s) => [s.id, s.type]));
  const sizeBySubset = new Map<string, number>();
  for (const card of cards) {
    const key = card.subset ?? "";
    sizeBySubset.set(key, (sizeBySubset.get(key) ?? 0) + 1);
  }

  const owned = cards.filter((c) => c.owned);
  if (owned.length === 0) return null;

  return owned.reduce((best, card) => {
    const rank = rarityRank(typeBySubset.get(card.subset ?? ""));
    const bestRank = rarityRank(typeBySubset.get(best.subset ?? ""));
    if (rank !== bestRank) return rank > bestRank ? card : best;
    const size = sizeBySubset.get(card.subset ?? "") ?? Number.MAX_SAFE_INTEGER;
    const bestSize = sizeBySubset.get(best.subset ?? "") ?? Number.MAX_SAFE_INTEGER;
    if (size !== bestSize) return size < bestSize ? card : best;
    return compareCardCode(card.card_code, best.card_code) < 0 ? card : best;
  }, owned[0]);
}

/** Libelle lisible d'un sous-ensemble (repli sur son identifiant). */
export function subsetLabel(subsetId: string | null, subsets: SubsetRow[]): string {
  if (!subsetId) return "Sans sous-ensemble";
  return subsets.find((s) => s.id === subsetId)?.name ?? subsetId;
}

export function formatDateFr(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatShortDateFr(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
