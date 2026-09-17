"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePrefsAction, updateProfileAction } from "@/lib/actions";
import { AVATARS, avatarFor } from "@/lib/avatars";
import type { Prefs, ProfileRow, Theme, ViewMode } from "@/lib/types";

export interface ProfileClientProps {
  profile: ProfileRow;
}

/**
 * Edition d'identite (pseudo + avatar) et des preferences. La gestion des
 * focus (creation, renommage, suppression) vit desormais sur /focus, plus
 * logique qu'ici.
 */
export default function ProfileClient({ profile }: ProfileClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [pseudonym, setPseudonym] = useState(profile.pseudonym ?? "");
  const [avatarSeed, setAvatarSeed] = useState(profile.avatar_seed ?? "basketball");
  const [prefs, setPrefs] = useState<Prefs>(profile.prefs);

  function flash(message: string) {
    setError(null);
    setSaved(message);
    setTimeout(() => setSaved(null), 2500);
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Enregistrement impossible.");
      else {
        flash(message);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* -------- Identite -------- */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 text-3xl"
          >
            {avatarFor(avatarSeed).emoji}
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor="pseudonym" className="mb-1 block text-xs font-semibold">
              Pseudonyme
            </label>
            <input
              id="pseudonym"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              onBlur={() => {
                if ((profile.pseudonym ?? "") !== pseudonym)
                  run(() => updateProfileAction({ pseudonym }), "Pseudonyme enregistré.");
              }}
              maxLength={40}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        </div>

        <fieldset className="mt-3">
          <legend className="mb-1.5 text-xs font-semibold">Avatar</legend>
          <div className="flex flex-wrap gap-1.5">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.seed}
                type="button"
                title={avatar.label}
                aria-pressed={avatarSeed === avatar.seed}
                onClick={() => {
                  setAvatarSeed(avatar.seed);
                  run(
                    () => updateProfileAction({ avatar_seed: avatar.seed }),
                    "Avatar enregistré.",
                  );
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition ${
                  avatarSeed === avatar.seed
                    ? "bg-orange-100 ring-2 ring-orange-500 dark:bg-orange-500/20"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                }`}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      {/* -------- Preferences -------- */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold">Préférences</h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="mb-1 text-xs font-semibold">Affichage par défaut</p>
            <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
              {(["grid", "list"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={prefs.defaultView === mode}
                  disabled={pending}
                  onClick={() => {
                    setPrefs((p) => ({ ...p, defaultView: mode }));
                    run(() => updatePrefsAction({ defaultView: mode }), "Préférence enregistrée.");
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold ${
                    prefs.defaultView === mode
                      ? "bg-orange-500 text-white"
                      : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  {mode === "grid" ? "Grille" : "Liste"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold">Thème</p>
            <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
              {(["light", "dark"] as Theme[]).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  aria-pressed={prefs.theme === theme}
                  disabled={pending}
                  onClick={() => {
                    setPrefs((p) => ({ ...p, theme }));
                    document.documentElement.classList.toggle("dark", theme === "dark");
                    run(() => updatePrefsAction({ theme }), "Thème enregistré.");
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold ${
                    prefs.theme === theme
                      ? "bg-orange-500 text-white"
                      : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  {theme === "light" ? "Clair" : "Sombre"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold">Blocs de cartes (classeur, focus)</p>
            <div className="flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
              {([true, false] as const).map((collapsed) => (
                <button
                  key={String(collapsed)}
                  type="button"
                  aria-pressed={prefs.collapseSectionsByDefault === collapsed}
                  disabled={pending}
                  onClick={() => {
                    setPrefs((p) => ({ ...p, collapseSectionsByDefault: collapsed }));
                    run(
                      () => updatePrefsAction({ collapseSectionsByDefault: collapsed }),
                      "Préférence enregistrée.",
                    );
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold ${
                    prefs.collapseSectionsByDefault === collapsed
                      ? "bg-orange-500 text-white"
                      : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                  }`}
                >
                  {collapsed ? "Repliés" : "Dépliés"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
          {saved}
        </p>
      ) : null}
    </div>
  );
}
