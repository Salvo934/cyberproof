import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_AUTHENTICATED_ROUTE, isGuestOnlyRoute, isPublicRoute } from "@/lib/auth/routes";

/**
 * Proxy di autenticazione:
 * - rinnova la sessione Supabase (cookie) a ogni richiesta;
 * - manda al login chi non è autenticato;
 * - manda alla dashboard chi è già autenticato e apre login/registrazione.
 *
 * È un controllo di navigazione: la protezione reale dei dati è affidata
 * alle policy RLS del database e dello storage.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    // Senza configurazione l'app mostra una pagina di istruzioni.
    if (request.nextUrl.pathname === "/setup") return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // Con la configurazione presente la pagina di istruzioni non serve.
  if (request.nextUrl.pathname === "/setup") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers ?? {})) response.headers.set(name, value);
      },
    },
  });

  // getClaims() verifica il JWT: non fidarsi di getSession() lato server.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    // Mantiene i cookie di sessione eventualmente rinnovati.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!isAuthenticated && !isPublicRoute(pathname) && pathname !== "/setup") {
    const next = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return redirectTo(`/login${next}`);
  }

  if (isAuthenticated && (isGuestOnlyRoute(pathname) || pathname === "/setup")) {
    return redirectTo(DEFAULT_AUTHENTICATED_ROUTE);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
