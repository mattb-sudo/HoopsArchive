"use client";

/** Filet de securite global : erreur de lecture Supabase, session expiree, etc. */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <p className="text-5xl">😕</p>
      <h1 className="mt-4 text-xl font-bold">Une erreur est survenue</h1>
      <p className="mt-2 break-words text-sm text-zinc-600 dark:text-zinc-400">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
      >
        Réessayer
      </button>
    </div>
  );
}
