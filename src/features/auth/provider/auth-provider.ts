/*
 * AuthProvider contract.
 *
 * Shared interface between the mock provider (ships today, backs the UI
 * with localStorage + fake latency) and the Supabase provider
 * (introduced later by implementing this interface against
 * `@supabase/supabase-js`). Keep this file free of implementation
 * details so swapping providers is a single import change in
 * `features/auth/provider/index.ts`.
 *
 * Supabase mapping notes (for the future adapter):
 *   - `signInWithEmail(email)` -> `supabase.auth.signInWithOtp({ email })`
 *     or `signInWithPassword` depending on the chosen flow.
 *   - `signInWithGoogle()` -> `supabase.auth.signInWithOAuth({ provider: "google" })`.
 *   - `signOut()` -> `supabase.auth.signOut()`.
 *   - `getSession()` -> `supabase.auth.getSession()` then map User/Session.
 *   - `onAuthChange` -> `supabase.auth.onAuthStateChange`.
 */

import type { AuthSession } from "@/entities/auth";

export type AuthChangeListener = (session: AuthSession | null) => void;

export type AuthProvider = {
  readonly id: string;
  getSession(): Promise<AuthSession | null>;
  signInWithEmail(email: string): Promise<AuthSession>;
  signInWithGoogle(): Promise<AuthSession>;
  signOut(): Promise<void>;
  onAuthChange(listener: AuthChangeListener): () => void;
};
