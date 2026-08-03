import type { Metadata } from "next";
import Link from "next/link";
import AddSetPlaceholder from "@/components/AddSetPlaceholder";
import ProgressBar from "@/components/ProgressBar";
import SetCover from "@/components/SetCover";
import SetupNotice from "@/components/SetupNotice";
import { setCoverImage } from "@/lib/setCovers";
import { getCollectionSnapshot, requireUser, setProgressList } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
      <header>
        <h1 className="text-xl font-bold">Bibliothèque de sets</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
