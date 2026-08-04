import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
        Erreur 404
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">
        Page introuvable
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Ce classeur, cette carte ou ce focus n&apos;existe pas (ou plus).
      </p>
      <Link
        href="/accueil"
        className="mt-6 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
