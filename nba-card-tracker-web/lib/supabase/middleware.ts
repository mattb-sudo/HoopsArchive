import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseEnv } from "./env";

/**
 * Routes accessibles sans etre connecte. `/auth` contient le point de retour
 * des liens envoyes par email (confirmation d'inscription) : il doit rester
 * joignable, sinon le code ne peut jamais etre echange contre une session.
 */
// "/api" est public au sens de ce middleware : les routes API gerent leur
// propre logique (ex. webhook de conformite eBay, appele par des serveurs
// tiers sans cookie de session) plutot que d'etre redirigees vers /login.
const PUBLIC_PATHS = ["/login", "/auth", "/api"];

/** Routes dont un utilisateur deja connecte doit etre sorti. */
const AUTH_ENTRY_PATHS = ["/login"];

function matchesPath(paths: string[], pathname: string): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Rafraichit la session Supabase a chaque requete et applique la protection
 * des routes :
 *   - non connecte  -> redirection vers /login
 *   - connecte      -> /login redirige vers /accueil
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Sans variables d'environnement on laisse passer : l'application affiche
  // alors un ecran expliquant comment configurer Supabase.
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Projet Supabase injoignable : on ne bloque pas la navigation, les pages
    // afficheront le message d'erreur approprie.
    return response;
  }

  const { pathname, search } = request.nextUrl;

  if (!userId && !matchesPath(PUBLIC_PATHS, pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return withCookies(NextResponse.redirect(target), response);
  }

  if (userId && matchesPath(AUTH_ENTRY_PATHS, pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = "/accueil";
    target.search = "";
    return withCookies(NextResponse.redirect(target), response);
  }

  return response;
}

/** Recopie les cookies de session sur la reponse de redirection. */
function withCookies(redirect: NextResponse, source: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
