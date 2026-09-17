"use client";

import { useMemo, useState, useTransition } from "react";
import CardTile from "./CardTile";
import ProgressBar from "./ProgressBar";
import { toggleOwnedAction } from "@/lib/actions";
import {
  SORT_LABELS,
  matchesQuery,
  matchesStatus,
  progressOf,
  sortCards,
  sortSubsets,
  subsetRank,
  type SortMode,
} from "@/lib/cards";
import type { CardWithState, StatusFilter, SubsetRow, ViewMode } from "@/lib/types";

export interface CardGridProps {
  cards: CardWithState[];
  subsets: SubsetRow[];
  /** Regroupement des sections : par sous-ensemble, par set, ou aucun. */
  groupBy?: "subset" | "set" | "none";
  initialStatus?: StatusFilter;
  initialView?: ViewMode;
  /** Etat initial (replie/deplie) de chaque section — piloté par la préférence du profil. */
  collapseByDefault?: boolean;
  /** Affiche le selecteur de sous-ensemble (inutile hors classeur). */
  showSubsetFilter?: boolean;
  showFilters?: boolean;
  showSetName?: boolean;
  emptyLabel?: string;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "owned", label: "Possédées" },
  { value: "missing", label: "Manquantes" },
  { value: "duplicates", label: "Doublons" },
];

interface Section {
  key: string;
  title: string;
  rank: number;
  cards: CardWithState[];
}

/** Chevron simple, sans emoji, pour l'ouverture/fermeture des blocs. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Grille (ou liste) de cartes avec barre de filtres, tri et bascule
 * "possedee" immediate. La bascule est optimiste : l'interface reagit tout de
 * suite, la server action confirme ou annule. Les sections (par sous-ensemble
 * ou par set) sont repliables individuellement.
 */
export default function CardGrid({
  cards,
  subsets,
  groupBy = "subset",
  initialStatus = "all",
  initialView = "grid",
  collapseByDefault = true,
  showSubsetFilter = true,
  showFilters = true,
  showSetName = false,
  emptyLabel = "Aucune carte ne correspond à ces critères.",
}: CardGridProps) {
  const [overrides, setOverrides] = useState<Record<string, { owned: boolean; qty: number }>>({});
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [subsetId, setSubsetId] = useState<string>("");
  const [rookieOnly, setRookieOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("number");
  const [view, setView] = useState<ViewMode>(initialView);
  // Exceptions individuelles a `collapseByDefault` (section ouverte/fermee au clic).
  const [sectionOverrides, setSectionOverrides] = useState<Record<string, boolean>>({});

  // Une carte normale et son parallele coche partagent le meme card_code :
  // la cle doit distinguer les deux pour les overrides optimistes / etats en
  // attente (sinon on melangerait leurs etats respectifs).
  const keyOf = (card: CardWithState) =>
    `${card.set_id} ${card.card_code} ${card.parallel?.id ?? ""}`;

  /** Cartes reelles + surcouche optimiste (les tuiles "parallele" ne sont pas basculables ici). */
  const effective = useMemo(
    () =>
      cards.map((card) => {
        if (card.parallel) return card;
        const patch = overrides[keyOf(card)];
        return patch ? { ...card, ...patch } : card;
      }),
    [cards, overrides],
  );

  const orderedSubsets = useMemo(() => sortSubsets(subsets), [subsets]);
  const subsetById = useMemo(() => new Map(subsets.map((s) => [s.id, s])), [subsets]);

  const filtered = useMemo(() => {
    const list = effective.filter(
      (card) =>
        matchesStatus(card, status) &&
        (!rookieOnly || card.rookie) &&
        (!subsetId || card.subset === subsetId) &&
        matchesQuery(card, query),
    );
    return sortCards(list, sort);
  }, [effective, status, rookieOnly, subsetId, query, sort]);

  const sections = useMemo<Section[]>(() => {
    if (groupBy === "none") {
      return [{ key: "all", title: "", rank: 0, cards: filtered }];
    }
    const map = new Map<string, Section>();
    for (const card of filtered) {
      const key = groupBy === "set" ? (card.set_id ?? "") : (card.subset ?? "");
      if (!map.has(key)) {
        const subset = subsetById.get(key);
        map.set(key, {
          key: key || "sans",
          title:
            groupBy === "set"
              ? (card.set_name ?? key)
              : (subset?.name ?? key ?? "Sans sous-ensemble"),
          rank: groupBy === "set" ? 0 : subsetRank(key, subset?.type),
          cards: [],
        });
      }
      map.get(key)!.cards.push(card);
    }
    return Array.from(map.values()).sort(
      (a, b) => a.rank - b.rank || a.title.localeCompare(b.title, "fr"),
    );
  }, [filtered, groupBy, subsetById]);

  function onToggle(card: CardWithState, next: boolean) {
    const key = keyOf(card);
    setError(null);
    setOverrides((prev) => ({
      ...prev,
      [key]: { owned: next, qty: next ? Math.max(card.qty, 1) : 0 },
    }));
    setPendingKeys((prev) => [...prev, key]);

    startTransition(async () => {
      const result = await toggleOwnedAction(card.set_id, card.card_code, next);
      setPendingKeys((prev) => prev.filter((k) => k !== key));
      if (!result.ok) {
        setOverrides((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
        setError(result.error ?? "Enregistrement impossible.");
      }
    });
  }

  function toggleSection(key: string) {
    setSectionOverrides((prev) => ({
      ...prev,
      [key]: !(key in prev ? prev[key] : !collapseByDefault),
    }));
  }

  const total = progressOf(effective);

  return (
    <div>
      {showFilters ? (
        <div className="mb-4 space-y-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="sr-only" htmlFor="grid-search">
            Filtrer les cartes
          </label>
          <input
            id="grid-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer (joueur, équipe, numéro…)"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950"
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="grid-sort">
              Trier par
            </label>
            <select
              id="grid-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  Tri : {SORT_LABELS[mode]}
                </option>
              ))}
            </select>

            <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
              {(["grid", "list"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  aria-pressed={view === mode}
                  className={`px-2 py-1.5 text-xs font-medium ${
                    view === mode
                      ? "bg-orange-500 text-white"
                      : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  {mode === "grid" ? "Grille" : "Liste"}
                </button>
              ))}
            </div>

            <span className="ml-auto font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {filtered.length} carte{filtered.length > 1 ? "s" : ""}
            </span>
          </div>

          {showSubsetFilter && orderedSubsets.length > 0 ? (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              <button
                type="button"
                onClick={() => setSubsetId("")}
                aria-pressed={subsetId === ""}
                title="Tous les sous-ensembles"
                className={`shrink-0 rounded-full px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-wide ring-1 transition ${
                  subsetId === ""
                    ? "bg-orange-500 text-white ring-orange-500"
                    : "bg-transparent text-zinc-500 ring-zinc-300 hover:ring-orange-400 dark:text-zinc-400 dark:ring-zinc-700"
                }`}
              >
                Tout
              </button>
              {orderedSubsets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubsetId((current) => (current === s.id ? "" : s.id))}
                  aria-pressed={subsetId === s.id}
                  title={s.name}
                  className={`shrink-0 rounded-full px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-wide ring-1 transition ${
                    subsetId === s.id
                      ? "bg-orange-500 text-white ring-orange-500"
                      : "bg-transparent text-zinc-500 ring-zinc-300 hover:ring-orange-400 dark:text-zinc-400 dark:ring-zinc-700"
                  }`}
                >
                  {s.id}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  aria-pressed={status === option.value}
                  className={`px-2.5 py-1.5 text-xs font-medium ${
                    status === option.value
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={rookieOnly}
                onChange={(e) => setRookieOnly(e.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
              Rookies uniquement
            </label>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const sectionProgress = progressOf(section.cards);
            const open = section.key in sectionOverrides
              ? sectionOverrides[section.key]
              : !collapseByDefault;
            return (
              <section key={section.key}>
                {section.title ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    aria-expanded={open}
                    className="mb-2 flex w-full items-center gap-2 text-left"
                  >
                    <Chevron open={open} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <h2 className="truncate text-sm font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                          {section.title}
                        </h2>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">
                          {sectionProgress.owned}/{sectionProgress.total}
                        </span>
                      </span>
                      <ProgressBar
                        owned={sectionProgress.owned}
                        total={sectionProgress.total}
                        pct={sectionProgress.pct}
                        size="sm"
                        showNumbers={false}
                        className="mt-1 max-w-xs"
                      />
                    </span>
                  </button>
                ) : null}

                {open ? (
                  <div
                    className={
                      view === "grid"
                        ? "grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6"
                        : "space-y-1.5"
                    }
                  >
                    {section.cards.map((card) => (
                      <CardTile
                        key={keyOf(card)}
                        card={card}
                        subsetLabel={
                          groupBy === "subset" ? null : (subsetById.get(card.subset ?? "")?.name ?? null)
                        }
                        view={view}
                        pending={pendingKeys.includes(keyOf(card))}
                        onToggle={onToggle}
                        showSetName={showSetName}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
