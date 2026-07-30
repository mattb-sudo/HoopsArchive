"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createFocusAction,
  deleteFocusAction,
  updateFocusAction,
  updatePrefsAction,
  updateProfileAction,
} from "@/lib/actions";
import { AVATARS, avatarFor } from "@/lib/avatars";
import { FOCUS_TYPE_LABELS, decodeTeamSeason, defaultFocusLabel } from "@/lib/focus";
import type { FocusOptions } from "@/lib/db";
import type { FocusRow, FocusType, Prefs, ProfileRow, Theme, ViewMode } from "@/lib/types";

export interface ProfileClientProps {
  profile: ProfileRow;
  focuses: FocusRow[];
  options: FocusOptions;
  /** owned / total par focus, calcule cote serveur. */
  focusProgress: Record<string, { owned: number; total: number; pct: number }>;
}

export default function ProfileClient({
  profile,
  focuses,
  options,
  focusProgress,
}: ProfileClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [pseudonym, setPseudonym] = useState(profile.pseudonym ?? "");
  const [avatarSeed, setAvatarSeed] = useState(profile.avatar_seed ?? "basketball");
  const [prefs, setPrefs] = useState<Prefs>(profile.prefs);

  const [focusType, setFocusType] = useState<FocusType>("player");
  const [focusName, setFocusName] = useState("");
  const [focusSeason, setFocusSeason] = useState(options.seasons[0] ?? "");
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

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

  const nameList = focusType === "player" ? options.players : options.teams;
  const resolvedId = useMemo(() => {
    const needle = focusName.trim().toLowerCase();
    return nameList.find((entry) => entry.name.toLowerCase() === needle)?.id ?? "";
  }, [focusName, nameList]);

  function submitFocus(event: React.FormEvent) {
    event.preventDefault();
    if (!resolvedId) {
      setError(
        focusType === "player"
          ? "Choisissez un joueur présent dans la liste."
          : "Choisissez une équipe présente dans la liste.",
      );
      return;
    }
    const displayName = nameList.find((e) => e.id === resolvedId)?.name ?? focusName;
    const formData = new FormData();
    formData.set("type", focusType);
    formData.set("value", resolvedId);
    if (focusType === "team_season") formData.set("season", focusSeason);
    formData.set(
      "label",
      defaultFocusLabel(focusType, displayName, focusType === "team_season" ? focusSeason : null),
    );

    startTransition(async () => {
      const result = await createFocusAction(formData);
      if (!result.ok) setError(result.error ?? "Création impossible.");
      else {
        setFocusName("");
        flash("Focus ajouté.");
        router.refresh();
      }
    });
  }

  const selectedAvatar = avatarFor(avatarSeed);

  return (
    <div className="space-y-6">
      {/* -------- Identite -------- */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 text-3xl"
          >
            {selectedAvatar.emoji}
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

      {/* -------- Focus -------- */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold">Mes focus</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Un focus suit un joueur, une équipe, ou une équipe sur une saison donnée.
        </p>

        {focuses.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Aucun focus pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {focuses.map((focus) => {
              const progress = focusProgress[focus.id];
              const detail =
                focus.type === "team_season" ? decodeTeamSeason(focus.value).season : null;
              return (
                <li key={focus.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5" title="Focus actif">
                      <input
                        type="checkbox"
                        checked={focus.active}
                        disabled={pending}
                        onChange={(e) =>
                          run(
                            () => updateFocusAction(focus.id, { active: e.target.checked }),
                            e.target.checked ? "Focus activé." : "Focus désactivé.",
                          )
                        }
                        className="h-4 w-4 accent-orange-500"
                      />
                      <span className="sr-only">Activer le focus {focus.label}</span>
                    </label>

                    {editing === focus.id ? (
                      <>
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                        />
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            run(
                              () => updateFocusAction(focus.id, { label: editLabel }),
                              "Libellé enregistré.",
                            );
                            setEditing(null);
                          }}
                          className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="px-2 py-1 text-xs text-zinc-500"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href={`/focus/${focus.id}`} className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${focus.active ? "" : "text-zinc-400"}`}>
                            {focus.label}
                          </p>
                          <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                            {FOCUS_TYPE_LABELS[focus.type]}
                            {detail ? ` · ${detail}` : ""}
                            {progress ? ` · ${progress.owned}/${progress.total} (${progress.pct}%)` : ""}
                          </p>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(focus.id);
                            setEditLabel(focus.label);
                          }}
                          className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-semibold dark:border-zinc-700"
                        >
                          Renommer
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm(`Supprimer le focus « ${focus.label} » ?`)) return;
                            run(() => deleteFocusAction(focus.id), "Focus supprimé.");
                          }}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Ajout de focus */}
        <form onSubmit={submitFocus} className="mt-4 space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
          <p className="text-xs font-semibold">+ Ajouter un focus</p>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="focus-type">
              Type de focus
            </label>
            <select
              id="focus-type"
              value={focusType}
              onChange={(e) => {
                setFocusType(e.target.value as FocusType);
                setFocusName("");
              }}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {(Object.keys(FOCUS_TYPE_LABELS) as FocusType[]).map((type) => (
                <option key={type} value={type}>
                  {FOCUS_TYPE_LABELS[type]}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="focus-name">
              {focusType === "player" ? "Joueur" : "Équipe"}
            </label>
            <input
              id="focus-name"
              list="focus-name-options"
              value={focusName}
              onChange={(e) => setFocusName(e.target.value)}
              placeholder={focusType === "player" ? "Nom du joueur" : "Nom de l'équipe"}
              autoComplete="off"
              className="min-w-[12rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <datalist id="focus-name-options">
              {nameList.map((entry) => (
                <option key={entry.id} value={entry.name} />
              ))}
            </datalist>

            {focusType === "team_season" ? (
              <>
                <label className="sr-only" htmlFor="focus-season">
                  Saison
                </label>
                <select
                  id="focus-season"
                  value={focusSeason}
                  onChange={(e) => setFocusSeason(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {options.seasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Les suggestions proviennent uniquement des joueurs et équipes réellement présents dans
            la checklist.
          </p>
        </form>
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
