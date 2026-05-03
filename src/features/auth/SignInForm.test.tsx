import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AuthProvider } from "./AuthContext";
import { useAuth } from "./use-auth";
import { SignInForm } from "./ui/SignInForm";

function AuthStatusProbe() {
  const { status, session, pending, error } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{status}</span>
      <span data-testid="auth-email">{session?.user.email ?? ""}</span>
      <span data-testid="auth-pending">{pending ?? "none"}</span>
      <span data-testid="auth-error">{error ?? "none"}</span>
    </div>
  );
}

describe("SignInForm + AuthProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("signs in with a valid email and updates auth state", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignInForm />
        <AuthStatusProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent(/loading|anonymous/);

    await user.type(screen.getByRole("textbox", { name: /email address/i }), "ada@musehub.dev");
    await user.click(screen.getByRole("button", { name: /continue with email/i }));

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByTestId("auth-email")).toHaveTextContent("ada@musehub.dev");
    expect(screen.getByTestId("auth-pending")).toHaveTextContent("none");
    expect(screen.getByTestId("auth-error")).toHaveTextContent("none");
  });

  it("disables the email button until the email includes an @", () => {
    render(
      <AuthProvider>
        <SignInForm />
      </AuthProvider>,
    );

    expect(screen.getByRole("button", { name: /continue with email/i })).toBeDisabled();
  });

  it("signs in with the Google mock immediately", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignInForm />
        <AuthStatusProbe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByTestId("auth-email")).toHaveTextContent("fmw19990718@gmail.com");
  });

  it("persists the session across re-mounts via localStorage", async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <AuthProvider>
        <SignInForm />
      </AuthProvider>,
    );

    await user.type(screen.getByRole("textbox", { name: /email address/i }), "ada@musehub.dev");
    await user.click(screen.getByRole("button", { name: /continue with email/i }));

    unmount();

    render(
      <AuthProvider>
        <AuthStatusProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByTestId("auth-email")).toHaveTextContent("ada@musehub.dev");
  });

  it("exposes pending state while the sign-in is in flight", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignInForm />
        <AuthStatusProbe />
      </AuthProvider>,
    );

    const promise = user.click(screen.getByRole("button", { name: /continue with google/i }));
    // The reducer flips to pending synchronously inside the click handler.
    await screen.findByText("signin-google");
    await promise;
    expect(await screen.findByText("none")).toBeInTheDocument();
  });

  it("drops an expired session on next getSession and stays anonymous", async () => {
    const expired = {
      user: {
        id: "mock-old@musehub.dev",
        email: "old@musehub.dev",
        name: "old",
        provider: "email",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      accessToken: "mock-token-old",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    window.localStorage.setItem("musehub.auth.session.v1", JSON.stringify(expired));

    render(
      <AuthProvider>
        <AuthStatusProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("anonymous")).toBeInTheDocument();
    expect(window.localStorage.getItem("musehub.auth.session.v1")).toBeNull();
  });

  it("propagates cross-tab sign-out via storage events", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignInForm />
        <AuthStatusProbe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    await screen.findByText("authenticated");

    // Simulate another tab writing null to localStorage.
    act(() => {
      window.localStorage.removeItem("musehub.auth.session.v1");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "musehub.auth.session.v1",
          oldValue: "whatever",
          newValue: null,
          storageArea: window.localStorage,
        }),
      );
    });

    expect(await screen.findByText("anonymous")).toBeInTheDocument();
  });
});
