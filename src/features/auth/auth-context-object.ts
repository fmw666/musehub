import type { AuthSession, AuthStatus } from "@/entities/auth";

import { createContext } from "react";

export type AuthPending = null | "signin-email" | "signin-google" | "signout";

export type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  pending: AuthPending;
  error: string | null;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
