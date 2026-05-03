import { createContext } from "react";

import type { AuthSession, AuthStatus } from "@/entities/auth";

/*
 * Auth state is exposed via THREE separate contexts so components only
 * re-render when the slice they actually read changes:
 *
 *   - AuthSessionContext   — status + session. Read by most of the app
 *     (rail affordance, route guards, personalized fetchers). Changes
 *     only on sign-in / sign-out / expiry → rare.
 *
 *   - AuthPendingContext   — pending + error. Read almost exclusively
 *     by the sign-in form / any "in-flight" UI. Changes on every click
 *     and every keystroke that clears an error → frequent.
 *
 *   - AuthActionsContext   — signInWithEmail / signInWithGoogle /
 *     signOut / clearError. Stable for the lifetime of the provider
 *     (references never change), so readers get zero re-renders from
 *     this context once mounted.
 *
 * Before the split, putting everything in one context meant that every
 * pending-start dispatch (a click) re-rendered every consumer — the
 * rail user menu included, which doesn't care about pending state.
 */

export type AuthPending = null | "signin-email" | "signin-google" | "signout";

export type AuthSessionValue = {
  status: AuthStatus;
  session: AuthSession | null;
};

export type AuthPendingValue = {
  pending: AuthPending;
  error: string | null;
};

export type AuthActions = {
  signInWithEmail: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const AuthSessionContext = createContext<AuthSessionValue | null>(null);
export const AuthPendingContext = createContext<AuthPendingValue | null>(null);
export const AuthActionsContext = createContext<AuthActions | null>(null);
