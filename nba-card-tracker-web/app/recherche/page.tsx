import type { Metadata } from "next";
import CardGrid from "@/components/CardGrid";
import SetupNotice from "@/components/SetupNotice";
import { getProfile, getSets, getSubsets, requireUser, searchCards } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NOISE_TEXTURE } from "@/lib/textures";
import { parseStatusFilter, type SubsetType } from "@/lib/types";

export const metadata: Metadata = { title: "Recherche" };
export const dynamic = "force-dynamic";

const SUBSET_TYPES: { value: SubsetType; label: string }[] = [
  { value: "base", label: "Base" },
  { value: "insert", label: "Inserts" },
  { value: "autograph", label: "Autographes" },
];

interface PageProps {
  searchParams?: {
    q?: string;
    set?: string;
    type?: string;
    status?: string;
    rookie?: string;
  };
}

export default async function RecherchePage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const user = await requireUser();

  const q = (searchParams?.q ?? "").trim();
  const setId = searchParams?.set ?? "";
  const subsetType = searchParams?.type ?? "";
  const status = parseStatusFilter(searchParams?.status);
  const rookieOnly = searchParams?.rookie === "1";
  const hasCriteria = Boolean(q || setId || subsetType || rookieOnly || status !== "all");

  const [sets, subsets, profile] = await Promise.all([getSets(), getSubsets(), getProfile(user.id)]);

  const results = hasCriteria
    ? await searchCards({ q, setId, subsetType, status, rookieOnly })
    : [];

  const distinctSets = new Set(results.map((c) => c.set_id));

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-5 text-white shadow-[0_20px_45px_-20px_rgba(0,0,0,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-orange-400">
          Trouver une carte
        </p>
        <h1 className="relative mt-1 font-display text-2xl font-bold uppercase tracking-tight">
          Recherche
        </h1>
        <p className="relative mt-1 text-sm text-white/70">
          Par joueur, équipe, numéro de carte ou nom de set.
        </p>
      </header>

      {/* Formulaire GET : les criteres restent dans l'URL (partageable, rechargeable). */}
      <form
        action="/recherche"
        method="get"
        className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="q">
            Recherche
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="LeBron James, Lakers, HS-AE…"
            className="min-w-[12rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Rechercher
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="set">
            Set
          </label>
          <select
            id="set"
            name="set"
            defaultValue={setId}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Tous les sets</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="type">
            Type de sous-ensemble
          </label>
          <select
            id="type"
            name="type"
            defaultValue={subsetType}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Tous les types</option>
            {SUBSET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="status">
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="all">Possédées et manquantes</option>
            <option value="owned">Possédées uniquement</option>
            <option value="missing">Manquantes uniquement</option>
            <option value="duplicates">Doublons uniquement</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              name="rookie"
              value="1"
              defaultChecked={rookieOnly}
              className="h-4 w-4 accent-orange-500"
            />
            Rookies uniquement
          </label>
        </div>
      </form>

      {!hasCriteria ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Saisissez un nom de joueur, une équipe ou un numéro de carte pour lancer la recherche.
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold">
            {results.length} résultat{results.length > 1 ? "s" : ""}
          </p>
          <CardGrid
            cards={results}
            subsets={subsets}
            groupBy={distinctSets.size > 1 ? "set" : "none"}
            showSubsetFilter={false}
            showSetName={distinctSets.size > 1}
            initialView={profile.prefs.defaultView}
            collapseByDefault={profile.prefs.collapseSectionsByDefault}
            emptyLabel="Aucune carte ne correspond à cette recherche."
          />
        </>
      )}
    </div>
  );
}
