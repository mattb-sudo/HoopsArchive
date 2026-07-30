"use client";

import { useState, useTransition } from "react";
import { signInAction, signUpAction } from "@/lib/actions";

type Mode = "signin" | "signup";

/** Une redirection cote serveur remonte sous forme d'erreur : il faut la relayer. */
function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest ?? "").startsWith("NEXT_REDIRECT")
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const action = mode === "signin" ? signInAction : signUpAction;
        const result = await action({}, formData);
        if (result?.error) setError(result.error);
        if (result?.message) setMessage(result.message);
      } catch (err) {
        if (isRedirect(err)) throw err;
        setError((err as Error).message || "Connexion impossible.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="text-center">
        <p className="text-5xl">🏀</p>
        <h1 className="mt-3 text-2xl font-bold">NBA Card Tracker</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Suivez votre collection de cartes de basket.
        </p>
      </div>

      <div className="mt-6 flex overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
        {(
          [
            ["signin", "Se connecter"],
            ["signup", "Créer un compte"],
          ] as [Mode, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
              setMessage(null);
            }}
            aria-pressed={mode === value}
            className={`flex-1 px-3 py-2 text-sm font-semibold ${
              mode === value
                ? "bg-orange-500 text-white"
                : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input type="hidden" name="next" value={next ?? "/accueil"} />

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          {mode === "signup" ? (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">6 caractères minimum.</p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? "Un instant…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
