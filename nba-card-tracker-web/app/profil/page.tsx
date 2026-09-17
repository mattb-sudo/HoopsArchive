import type { Metadata } from "next";
import ProfileClient from "@/components/ProfileClient";
import SeamDivider from "@/components/SeamDivider";
import SetupNotice from "@/components/SetupNotice";
import { signOutAction } from "@/lib/actions";
import { avatarFor } from "@/lib/avatars";
import { getProfile, requireUser } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const avatar = avatarFor(profile.avatar_seed);

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-0.5 -rotate-1 font-hand text-lg text-orange-600 dark:text-orange-400">
          Collectionneur
        </p>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 text-2xl"
          >
            {avatar.emoji}
          </span>
          <h1 className="font-stat truncate text-[2.4rem] uppercase leading-[0.9] tracking-wide text-zinc-900 [text-shadow:1.5px_1.5px_0_rgba(0,0,0,0.08)] dark:text-zinc-50 dark:[text-shadow:1.5px_1.5px_0_rgba(0,0,0,0.35)] sm:text-5xl">
            {profile.pseudonym ?? "Collectionneur"}
          </h1>
        </div>
        <SeamDivider className="mt-1.5 text-orange-500/80" />
      </header>

      <ProfileClient profile={profile} />

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
