import { useEffect, type ReactNode } from "react";

import { routePaths } from "@/app/routing/route-paths";

import { useAuth } from "../use-auth";

type RequireAuthProps = {
  children: ReactNode;
  /**
   * Called when the guard redirects an anonymous visitor. App-level routing
   * listens for this and navigates to `/sign-in`. Kept as a callback (not
   * an imperative router call) so this module stays in the feature layer.
   */
  onRedirect: (to: string) => void;
  /**
   * Rendered while the initial `getSession()` is in flight. Defaults to
   * `null` so the gated page doesn't flash before we know the user.
   */
  fallback?: ReactNode;
};

/*
 * RequireAuth — gate a route behind an authenticated session.
 *
 * Renders `children` only when `status === "authenticated"`.
 * During `"loading"` it renders `fallback` (default `null`).
 * On `"anonymous"` it invokes `onRedirect(routePaths.signIn)` once and
 * renders `fallback` until the navigation happens.
 *
 * We purposefully perform the redirect inside `useEffect` so rendering
 * stays pure and React Strict Mode double-invokes don't fire twice.
 */
export function RequireAuth({ children, onRedirect, fallback = null }: RequireAuthProps) {
  const { status } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      onRedirect(routePaths.signIn);
    }
  }, [status, onRedirect]);

  if (status === "authenticated") return <>{children}</>;
  return <>{fallback}</>;
}
