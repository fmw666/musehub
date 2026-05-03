import { useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";

import type { AuthSession, AuthStatus } from "@/entities/auth";

import {
  AuthActionsContext,
  AuthPendingContext,
  AuthSessionContext,
  type AuthActions,
  type AuthPending,
  type AuthPendingValue,
  type AuthSessionValue,
} from "./auth-context-object";
import { getAuthProvider } from "./provider";

/*
 * Auth state machine.
 *
 * Single source of truth for the app's auth state. All action handlers
 * (`signInWithEmail`, `signInWithGoogle`, `signOut`) merely call into the
 * AuthProvider — they never touch React state directly. The provider's
 * `onAuthChange` broadcast is the only path that updates `session` /
 * `status`. This mirrors `supabase.auth.onAuthStateChange` semantics so
 * the Supabase adapter is a drop-in replacement with no double-render.
 *
 * The reducer owns four fields internally but we project them to two
 * different contexts (session vs pending) so consumers only re-render
 * when their slice changes. See `auth-context-object.ts`.
 */

type State = {
  status: AuthStatus;
  session: AuthSession | null;
  pending: AuthPending;
  error: string | null;
};

type Action =
  | { type: "session-changed"; session: AuthSession | null }
  | { type: "pending-start"; pending: Exclude<AuthPending, null> }
  | { type: "pending-end" }
  | { type: "error-set"; message: string }
  | { type: "error-clear" };

const initialState: State = {
  status: "loading",
  session: null,
  pending: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "session-changed": {
      const nextStatus: AuthStatus = action.session ? "authenticated" : "anonymous";
      if (state.session === action.session && state.status === nextStatus) return state;
      return { ...state, session: action.session, status: nextStatus };
    }
    case "pending-start":
      if (state.pending === action.pending && state.error === null) return state;
      return { ...state, pending: action.pending, error: null };
    case "pending-end":
      if (state.pending === null) return state;
      return { ...state, pending: null };
    case "error-set":
      return { ...state, pending: null, error: action.message };
    case "error-clear":
      if (state.error === null) return state;
      return { ...state, error: null };
    default:
      return state;
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Sign-in failed. Please try again.";
}

/*
 * Returns ms until `expiresAt`, clamped so the setTimeout stays in a
 * sane range:
 *   - negative / NaN inputs → 0 (fire immediately; the next getSession
 *     call drops the expired session)
 *   - very large inputs → capped at ~24 days to sidestep the 32-bit
 *     setTimeout ceiling (browsers clamp ≥2^31 ms to immediate fire)
 */
function msUntilExpiry(expiresAt: string | undefined): number {
  if (!expiresAt) return Number.POSITIVE_INFINITY;
  const target = Date.parse(expiresAt);
  if (Number.isNaN(target)) return Number.POSITIVE_INFINITY;
  const delta = target - Date.now();
  if (delta <= 0) return 0;
  return Math.min(delta, 2_147_000_000);
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const providerRef = useRef(getAuthProvider());
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const provider = providerRef.current;
    let active = true;

    const refreshFromProvider = () => {
      void provider.getSession().then((next) => {
        if (!active) return;
        dispatch({ type: "session-changed", session: next });
      });
    };

    const unsubscribe = provider.onAuthChange((next) => {
      if (!active) return;
      dispatch({ type: "session-changed", session: next });
    });

    refreshFromProvider();

    /*
     * Session expiry. Re-check on tab focus (long-idle tabs may be
     * holding a stale session) and when the page returns from the
     * background. Scheduling of a precise `setTimeout` for each new
     * session happens in the second effect below.
     */
    const onFocus = () => refreshFromProvider();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshFromProvider();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  /*
   * Precise expiry scheduler. Replaces the 60s polling loop: when the
   * session changes, schedule a single setTimeout that fires exactly
   * when the token expires. No wasted wake-ups, no 59s of staleness
   * in the worst case.
   */
  useEffect(() => {
    if (!state.session) return;
    const provider = providerRef.current;
    let active = true;

    const delay = msUntilExpiry(state.session.expiresAt);
    if (!Number.isFinite(delay)) return;

    const timer = window.setTimeout(() => {
      void provider.getSession().then((next) => {
        if (!active) return;
        dispatch({ type: "session-changed", session: next });
      });
    }, delay);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [state.session]);

  /*
   * Actions never change references across renders: we wrap them in
   * refs over the reducer/provider so useMemo produces a stable
   * AuthActions object for the entire lifetime of the provider.
   * Consumers reading *only* from AuthActionsContext will never
   * re-render after mount.
   */
  const actions = useMemo<AuthActions>(() => {
    const wrap = async <T,>(pending: Exclude<AuthPending, null>, op: () => Promise<T>) => {
      dispatch({ type: "pending-start", pending });
      try {
        await op();
        dispatch({ type: "pending-end" });
      } catch (err) {
        dispatch({ type: "error-set", message: describeError(err) });
        throw err;
      }
    };
    return {
      signInWithEmail: (email) => wrap("signin-email", () => providerRef.current.signInWithEmail(email)),
      signInWithGoogle: () => wrap("signin-google", () => providerRef.current.signInWithGoogle()),
      signOut: () => wrap("signout", () => providerRef.current.signOut()),
      clearError: () => dispatch({ type: "error-clear" }),
    };
  }, []);

  const sessionValue = useMemo<AuthSessionValue>(
    () => ({ status: state.status, session: state.session }),
    [state.status, state.session],
  );

  const pendingValue = useMemo<AuthPendingValue>(
    () => ({ pending: state.pending, error: state.error }),
    [state.pending, state.error],
  );

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthSessionContext.Provider value={sessionValue}>
        <AuthPendingContext.Provider value={pendingValue}>{children}</AuthPendingContext.Provider>
      </AuthSessionContext.Provider>
    </AuthActionsContext.Provider>
  );
}
