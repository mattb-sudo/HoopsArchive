import type { Metadata } from "next";
import Link from "next/link";
import AddSetPlaceholder from "@/components/AddSetPlaceholder";
import ProgressBar from "@/components/ProgressBar";
import SetCover from "@/components/SetCover";
import SetupNotice from "@/components/SetupNotice";
import { setCoverImage } from "@/lib/setCovers";
import { getCollectionSnapshot, requireUser, setProgressList } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NOISE_TEXTURE } from "@/lib/textures";

export const metadata: Metadata = { title: "Bibliothèque de sets" };
export const dynamic = "force-dynamic";

function yearOf(releaseDate: string | null): string {
  if (!releaseDate) return "—";
  return releaseDate.slice(0, 4);
}

export default async function SetsPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  await requireUser();

  const { sets, cards } = await getCollectionSnapshot();
  // getCollectionSnapshot trie deja les sets par release_date decroissante.
  const progress = setProgressList(sets, cards);

  return (
    <div className="space-y-4">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-5 text-white shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
        <p className="relative text-xs font-semibold uppercase tracking-widest text-orange-400">
          Bibliothèque
        </p>
        <h1 className="relative mt-1 font-display text-2xl font-bold uppercase tracking-tight">
          Tous les sets
        </h1>
        <p className="relative mt-1 text-sm text-white/70">
          {sets.length} set{sets.length > 1 ? "s" : ""} suivi{sets.length > 1 ? "s" : ""}, du plus
          récent au plus ancien.
        </p>
      </header>

      <ul className="space-y-3">
        {progress.map(({ set, owned, total, pct }) => (
          <li key={set.id}>
            <Link
              href={`/classeur/${encodeURIComponent(set.id)}`}
              className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <SetCover
                setId={set.id}
                name={set.name}
                imageSrc={setCoverImage(set.id)}
                className="w-14 shrink-0 text-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{set.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {set.manufacturer ?? "Fabricant inconnu"} · {yearOf(set.release_date)} ·{" "}
                  {total} carte{total > 1 ? "s" : ""} référencées
                </p>
                <ProgressBar owned={owned} total={total} pct={pct} size="sm" className="mt-2" />
              </div>
              <span aria-hidden className="text-zinc-400">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <AddSetPlaceholder />
    </div>
  );
}
