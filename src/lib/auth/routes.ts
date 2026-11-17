/** Rotte accessibili senza login. Tutto il resto richiede una sessione valida. */
export const PUBLIC_ROUTES = ["/login", "/signup", "/auth/forgot-password", "/auth/callback"] as const;

/** Rotte che un utente già autenticato non deve vedere (viene mandato alla dashboard). */
export const GUEST_ONLY_ROUTES = ["/login", "/signup", "/auth/forgot-password"] as const;

export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

function matches(pathname: string, routes: readonly string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export const isPublicRoute = (pathname: string) => matches(pathname, PUBLIC_ROUTES);
export const isGuestOnlyRoute = (pathname: string) => matches(pathname, GUEST_ONLY_ROUTES);

/**
 * Accetta solo percorsi interni come destinazione dopo il login, per evitare
 * open redirect verso siti esterni (es. `?next=https://evil.example`).
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }
  return value;
}
