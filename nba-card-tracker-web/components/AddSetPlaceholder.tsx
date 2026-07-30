"use client";

import { useState } from "react";

/**
 * Ajouter un set n'est pas encore disponible : un seul set existe dans la base
 * de reference. Le bouton reste visible mais desactive et explique pourquoi.
 */
export default function AddSetPlaceholder() {
  const [toast, setToast] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-disabled
        onClick={() => setToast(true)}
        className="w-full cursor-not-allowed rounded-xl border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
      >
        + Ajouter un set
      </button>
      {toast ? (
        <p
          role="status"
          className="mt-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Bientôt disponible : un seul set est chargé pour l&apos;instant (2025-26 Topps NBA
          Hoops). Les prochains seront ajoutés à la base de référence.
        </p>
      ) : null}
    </div>
  );
}
