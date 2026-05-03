/*
 * Mock AuthProvider.
 *
 * Backs the auth flow with localStorage and small artificial delays so the
 * UI can be built and tested without a real backend. Implements the same
 * `AuthProvider` contract the Supabase adapter will, so swapping the two
 * is a one-line change in `features/auth/provider/index.ts`.
 *
 * Cross-tab sync: we listen to the `storage` event so signing in or out in
 * one tab is immediately reflected in every other tab. Supabase's real
 * provider does this via its own WebSocket; mirroring it here keeps the
 * rest of the app agnostic to which implementation is active.
 */

import type { AuthSession, AuthUser } from "@/entities/auth";

import type { AuthChangeListener, AuthProvider } from "./auth-provider";

const STORAGE_KEY = "musehub.auth.session.v1";
const MOCK_DELAY_MS = 320;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession> | null;
    if (!parsed || !parsed.user || typeof parsed.user.email !== "string") return null;
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

function readStoredSession(): AuthSession | null {
  if (!isBrowser()) return null;
  return parseSession(window.localStorage.getItem(STORAGE_KEY));
}

function writeStoredSession(session: AuthSession | null) {
  if (!isBrowser()) return;
  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function isExpired(session: AuthSession): boolean {
  const expiresAt = Date.parse(session.expiresAt);
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt <= Date.now();
}

function createMockUser(params: {
  email: string;
  provider: AuthUser["provider"];
  name?: string;
}): AuthUser {
  const email = params.email.trim().toLowerCase();
  const localPart = email.split("@")[0];
  const baseName = params.name ?? (localPart && localPart.length > 0 ? localPart : "muse-user");
  return {
    id: `mock-${email}`,
    email,
    name: baseName,
    provider: params.provider,
    createdAt: new Date().toISOString(),
  };
}

function createMockSession(user: AuthUser): AuthSession {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  return {
    user,
    accessToken: `mock-token-${user.id}`,
    expiresAt,
  };
}

export function createMockAuthProvider(): AuthProvider {
  const listeners = new Set<AuthChangeListener>();
  let storageListenerAttached = false;

  function setSession(next: AuthSession | null, writeThrough: boolean) {
    if (writeThrough) {
      writeStoredSession(next);
    }
    listeners.forEach((listener) => {
      try {
        listener(next);
      } catch {
        // listeners must not break each other
      }
    });
  }

  function ensureStorageListener() {
    if (storageListenerAttached || !isBrowser()) return;
    storageListenerAttached = true;
    window.addEventListener("storage", (event) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const next = parseSession(event.newValue ?? null);
      setSession(next, false);
    });
  }

  return {
    id: "mock",

    async getSession() {
      ensureStorageListener();
      await wait(80);
      const stored = readStoredSession();
      if (stored && isExpired(stored)) {
        setSession(null, true);
        return null;
      }
      return stored;
    },

    async signInWithEmail(email) {
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes("@")) {
        throw new Error("Please enter a valid email address.");
      }
      await wait(MOCK_DELAY_MS);
      const user = createMockUser({ email: trimmed, provider: "email" });
      const session = createMockSession(user);
      setSession(session, true);
      return session;
    },

    async signInWithGoogle() {
      await wait(MOCK_DELAY_MS);
      const user = createMockUser({
        email: "fmw19990718@gmail.com",
        provider: "google",
        name: "fmw19990718",
      });
      const session = createMockSession(user);
      setSession(session, true);
      return session;
    },

    async signOut() {
      await wait(120);
      setSession(null, true);
    },

    onAuthChange(listener) {
      ensureStorageListener();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
