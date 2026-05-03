import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";

import type { AuthSession, AuthStatus } from "@/entities/auth";

import { AuthContext, type AuthContextValue, type AuthPending } from "./auth-context-object";
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
 * Pending and error are local UI concerns that don't come from the
 * provider, so they live in the reducer next to the session fields.
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
    case "session-changed":
      return {
        ...state,
        session: action.session,
        status: action.session ? "authenticated" : "anonymous",
      };
    case "pending-start":
      return { ...state, pending: action.pending, error: null };
    case "pending-end":
      return { ...state, pending: null };
    case "error-set":
      return { ...state, pending: null, error: action.message };
    case "error-clear":
      return { ...state, error: null };
    default:
      return state;
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Sign-in failed. Please try again.";
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

    const unsubscribe = provider.onAuthChange((next) => {
      if (!active) return;
      dispatch({ type: "session-changed", session: next });
    });

    provider
      .getSession()
      .then((initial) => {
        if (!active) return;
        dispatch({ type: "session-changed", session: initial });
      })
      .catch(() => {
        if (!active) return;
        dispatch({ type: "session-changed", session: null });
      });

    /*
     * Session expiry watchdog. Re-checks the stored session every minute
     * and also on tab focus so a long-idle tab doesn't trust a stale
     * session. The real Supabase client refreshes access tokens here;
     * for the mock we just trigger a sign-out when `expiresAt` has passed.
     */
    const pollId = window.setInterval(() => {
      void provider.getSession().then((next) => {
        if (!active) return;
        dispatch({ type: "session-changed", session: next });
      });
    }, 60_000);

    const onFocus = () => {
      void provider.getSession().then((next) => {
        if (!active) return;
        dispatch({ type: "session-changed", session: next });
      });
    };
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(pollId);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    dispatch({ type: "pending-start", pending: "signin-email" });
    try {
      await providerRef.current.signInWithEmail(email);
      dispatch({ type: "pending-end" });
    } catch (err) {
      dispatch({ type: "error-set", message: describeError(err) });
      throw err;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: "pending-start", pending: "signin-google" });
    try {
      await providerRef.current.signInWithGoogle();
      dispatch({ type: "pending-end" });
    } catch (err) {
      dispatch({ type: "error-set", message: describeError(err) });
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    dispatch({ type: "pending-start", pending: "signout" });
    try {
      await providerRef.current.signOut();
      dispatch({ type: "pending-end" });
    } catch (err) {
      dispatch({ type: "error-set", message: describeError(err) });
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "error-clear" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      session: state.session,
      pending: state.pending,
      error: state.error,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [
      state.status,
      state.session,
      state.pending,
      state.error,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
