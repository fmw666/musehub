/*
 * Supabase AuthProvider (stub).
 *
 * Not wired yet. Kept as a placeholder so the Supabase adapter has a
 * predetermined home and the rest of the app can keep depending on
 * `features/auth/provider` without caring which implementation is active.
 *
 * To enable Supabase:
 *   1. npm install @supabase/supabase-js
 *   2. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in your .env
 *   3. Implement the functions below against the real client.
 *   4. Switch `features/auth/provider/index.ts` to export this provider.
 *
 * The returned object must satisfy the `AuthProvider` contract so no UI
 * code changes are needed.
 */

import type { AuthProvider } from "./auth-provider";

export function createSupabaseAuthProvider(): AuthProvider {
  throw new Error(
    "Supabase auth provider is not implemented yet. " +
      "Install @supabase/supabase-js and fill in features/auth/provider/supabase-auth-provider.ts.",
  );
}
