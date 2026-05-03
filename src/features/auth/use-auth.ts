import { useContext, useMemo } from "react";

import {
  AuthActionsContext,
  AuthPendingContext,
  AuthSessionContext,
  type AuthActions,
  type AuthPendingValue,
  type AuthSessionValue,
} from "./auth-context-object";

/*
 * Fine-grained hooks so each component subscribes to the smallest
 * slice of auth it needs. Prefer these over the legacy `useAuth()`
 * aggregate; aggregate access forces a re-render every time any
 * slice changes.
 */

export function useAuthSession(): AuthSessionValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) throw new Error("useAuthSession must be used inside <AuthProvider>.");
  return ctx;
}

export function useAuthPending(): AuthPendingValue {
  const ctx = useContext(AuthPendingContext);
  if (!ctx) throw new Error("useAuthPending must be used inside <AuthProvider>.");
  return ctx;
}

export function useAuthActions(): AuthActions {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error("useAuthActions must be used inside <AuthProvider>.");
  return ctx;
}

/*
 * Back-compat aggregate hook. Kept so existing tests and the few
 * read-everything call sites (e.g. SignInForm, which does legitimately
 * need session + pending + actions) keep working. Prefer the
 * fine-grained hooks above for new code.
 */
export type UseAuthValue = AuthSessionValue & AuthPendingValue & AuthActions;

export function useAuth(): UseAuthValue {
  const session = useAuthSession();
  const pending = useAuthPending();
  const actions = useAuthActions();
  return useMemo(
    () => ({ ...session, ...pending, ...actions }),
    [session, pending, actions],
  );
}
