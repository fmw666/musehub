/*
 * Auth provider entry point.
 *
 * This is the single file to change when migrating from the local mock
 * to Supabase. Everything above `features/auth` depends only on the
 * `AuthProvider` interface, not on the concrete implementation.
 */

import type { AuthProvider } from "./auth-provider";
import { createMockAuthProvider } from "./mock-auth-provider";

let cached: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (!cached) {
    cached = createMockAuthProvider();
  }
  return cached;
}

/** Test helper — resets the cached singleton so each test starts clean. */
export function __resetAuthProviderForTests() {
  cached = null;
}

export type { AuthProvider, AuthChangeListener } from "./auth-provider";
