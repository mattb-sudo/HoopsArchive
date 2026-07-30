import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Point de retour des liens envoyes par email par Supabase (confirmation
 * d'inscription, reinitialisation de mot de passe). Le lien contient un `code`
 * a echanger contre une session, puis on entre dans l'application.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/accueil";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (!code) {
    const description = searchParams.get("error_description") ?? "Lien invalide ou expiré.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(description)}`,
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
