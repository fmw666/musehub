import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../AuthContext";
import { RequireAuth } from "./RequireAuth";

describe("RequireAuth", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("redirects anonymous visitors to /sign-in", async () => {
    const onRedirect = vi.fn();

    render(
      <AuthProvider>
        <RequireAuth onRedirect={onRedirect} fallback={<div>loading</div>}>
          <div>protected content</div>
        </RequireAuth>
      </AuthProvider>,
    );

    // Session resolves to null → guard fires a redirect after commit.
    await vi.waitFor(() => {
      expect(onRedirect).toHaveBeenCalledWith("/sign-in");
    });
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("renders protected content for authenticated sessions", async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    window.localStorage.setItem(
      "musehub.auth.session.v1",
      JSON.stringify({
        user: {
          id: "mock-ada@musehub.dev",
          email: "ada@musehub.dev",
          name: "ada",
          provider: "email",
          createdAt: new Date().toISOString(),
        },
        accessToken: "mock-token-ada",
        expiresAt: future,
      }),
    );

    const onRedirect = vi.fn();

    render(
      <AuthProvider>
        <RequireAuth onRedirect={onRedirect} fallback={<div>loading</div>}>
          <div>protected content</div>
        </RequireAuth>
      </AuthProvider>,
    );

    expect(await screen.findByText("protected content")).toBeInTheDocument();
    expect(onRedirect).not.toHaveBeenCalled();
  });
});
