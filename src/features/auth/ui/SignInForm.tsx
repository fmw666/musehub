import { Button, Input } from "@heroui/react";
import { type FormEvent, useEffect, useState } from "react";

import { useAuthActions, useAuthPending, useAuthSession } from "../use-auth";

type SignInFormProps = {
  onAuthenticated?: () => void;
};

/*
 * Sign-in form.
 *
 * Two flows: Google OAuth (mock) and email. Both hit the same
 * AuthProvider, so swapping the mock for Supabase later only changes
 * `features/auth/provider/index.ts`.
 *
 * Pending and error state live on the AuthContext (global) so any other
 * part of the app can react to them (loading shells, banners, etc.).
 * The "Last used" tag next to Google mirrors Variant's / the reference
 * screenshot — we stash the last-used method in localStorage so repeat
 * visitors see the hint they last succeeded with.
 */
const LAST_METHOD_KEY = "musehub.auth.last-method.v1";

function readLastMethod(): "google" | "email" | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LAST_METHOD_KEY);
  return v === "google" || v === "email" ? v : null;
}

function writeLastMethod(method: "google" | "email") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_METHOD_KEY, method);
}

export function SignInForm({ onAuthenticated }: SignInFormProps) {
  const { signInWithEmail, signInWithGoogle, clearError } = useAuthActions();
  const { pending, error } = useAuthPending();
  const { status } = useAuthSession();
  const [email, setEmail] = useState("");
  const [lastMethod] = useState<"google" | "email" | null>(() => readLastMethod());

  // Clear any stale error when the form mounts or the user starts typing again.
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Fire the onAuthenticated hook as soon as the global status flips. This
  // makes the form passive — it doesn't need to know whether the provider
  // resolves synchronously (mock) or via a browser redirect (Supabase OAuth).
  useEffect(() => {
    if (status === "authenticated") {
      onAuthenticated?.();
    }
  }, [status, onAuthenticated]);

  const busy = pending !== null;

  const handleGoogle = () => {
    void (async () => {
      try {
        await signInWithGoogle();
        writeLastMethod("google");
      } catch {
        // Error state is already surfaced via `error` from the context.
      }
    })();
  };

  const handleEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (async () => {
      try {
        await signInWithEmail(email);
        writeLastMethod("email");
      } catch {
        // Error state is already surfaced via `error` from the context.
      }
    })();
  };

  const emailValid = email.trim().includes("@");

  return (
    <div className="signin-form" aria-busy={busy}>
      <div className="signin-google-row">
        <Button
          className="signin-google-btn"
          type="button"
          variant="bordered"
          isDisabled={busy}
          onPress={handleGoogle}
          aria-label="Continue with Google"
        >
          <GoogleGlyph aria-hidden="true" />
          <span>{pending === "signin-google" ? "Signing in…" : "Continue with Google"}</span>
        </Button>
        {lastMethod === "google" ? <span className="signin-last-used">Last used</span> : null}
      </div>

      <div className="signin-divider" role="separator" aria-label="or">
        <span>or</span>
      </div>

      <form className="signin-email-form" onSubmit={handleEmail} noValidate>
        <Input
          className="signin-email-input"
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) clearError();
          }}
          isDisabled={busy}
          autoComplete="email"
        />
        <Button
          className="signin-email-btn"
          type="submit"
          variant="solid"
          isDisabled={!emailValid || busy}
          aria-label="Continue with Email"
        >
          {pending === "signin-email" ? "Signing in…" : "Continue with Email"}
        </Button>
        {lastMethod === "email" ? (
          <span className="signin-last-used signin-last-used--email">Last used</span>
        ) : null}
      </form>

      {error ? (
        <p className="signin-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="18"
      height="18"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
