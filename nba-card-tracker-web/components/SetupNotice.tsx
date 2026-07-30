import { missingSupabaseEnvKeys } from "@/lib/supabase/env";

/**
 * Ecran affiche quand les variables d'environnement Supabase sont absentes.
 * Permet a l'application de se construire et de demarrer sans base de donnees.
 */
export default function SetupNotice() {
  const missing = missingSupabaseEnvKeys();

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
      <h1 className="text-lg font-bold">Connexion à la base de données à configurer</h1>
      <p className="mt-2">
        L&apos;application a besoin d&apos;un projet Supabase pour fonctionner. Il manque
        {missing.length > 1 ? " les variables" : " la variable"} :
      </p>
      <ul className="mt-2 list-inside list-disc font-mono text-xs">
        {(missing.length > 0
          ? missing
          : ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
        ).map((key) => (
          <li key={key}>{key}</li>
        ))}
      </ul>
      <p className="mt-3">
        En local : copiez <code className="font-mono">.env.local.example</code> en{" "}
        <code className="font-mono">.env.local</code> et renseignez les deux valeurs (voir le
        fichier <code className="font-mono">README.md</code>). Sur Vercel : Settings &gt;
        Environment Variables.
      </p>
    </div>
  );
}
