import type { Metadata } from "next";
import Link from "next/link";
import CardVisual from "@/components/CardVisual";
import ProfileClient from "@/components/ProfileClient";
import SetupNotice from "@/components/SetupNotice";
import { signOutAction } from "@/lib/actions";
import { formatDateFr, progressOf, rarestOwnedCard, subsetLabel } from "@/lib/cards";
import {
  focusProgressList,
  getCollectionSnapshot,
  getFocusOptions,
  getProfile,
  requireUser,
} from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NOISE_TEXTURE } from "@/lib/textures";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const user = await requireUser();

  const [profile, snapshot, options] = await Promise.all([
    getProfile(user.id),
    getCollectionSnapshot(),
    getFocusOptions(),
  ]);

  const { sets, subsets, cards, cardPlayers, focuses } = snapshot;
  const global = progressOf(cards);
  const rarest = rarestOwnedCard(cards, subsets);
  const followedSets = sets.filter((set) => cards.some((c) => c.set_id === set.id && c.owned));

  const focusProgress = Object.fromEntries(
    focusProgressList(focuses, cards, cardPlayers).map((entry) => [
      entry.focus.id,
      { owned: entry.owned, total: entry.total, pct: entry.pct },
    ]),
  );

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-5 text-white shadow-[0_20px_45px_-20px_rgba(0,0,0,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-orange-400">
          Compte
        </p>
        <h1 className="relative mt-1 font-display text-2xl font-bold uppercase tracking-tight">
          Profil
        </h1>
        <p className="relative mt-1 text-sm text-white/70">
          {user.email ?? "—"} · inscrit le {formatDateFr(user.created_at)}
        </p>
      </header>

      {/* Statistiques calculees */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-mono text-2xl font-black tabular-nums">{global.owned}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">cartes possédées</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-mono text-2xl font-black tabular-nums">{followedSets.length}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            set{followedSets.length > 1 ? "s" : ""} suivi{followedSets.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            Carte la plus rare
          </p>
          {rarest ? (
            <Link
              href={`/carte/${encodeURIComponent(rarest.set_id)}/${encodeURIComponent(rarest.card_code)}`}
              className="mt-1 flex items-center gap-2"
            >
              <span className="w-8 shrink-0">
                <CardVisual
                  player={rarest.player}
                  team={rarest.team}
                  cardCode={rarest.card_code}
                  rookie={rarest.rookie}
                  size="thumb"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{rarest.player ?? "—"}</span>
                <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {subsetLabel(rarest.subset, subsets)}
                </span>
              </span>
            </Link>
          ) : (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">—</p>
          )}
        </div>
      </section>

      <ProfileClient
        profile={profile}
        focuses={focuses}
        options={options}
        focusProgress={focusProgress}
      />

      {/* Deconnexion */}
      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
