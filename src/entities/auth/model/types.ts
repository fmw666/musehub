/*
 * Auth domain types.
 *
 * Shared between features/auth (UI + state) and any future backend adapter
 * (currently a local mock, tomorrow Supabase). Kept intentionally minimal
 * so the Supabase `User` / `Session` shapes can be mapped into these
 * without leaking @supabase/supabase-js types into UI code.
 */

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "email" | "mock";
  createdAt: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  expiresAt: string;
};

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthError = {
  code: string;
  message: string;
};
