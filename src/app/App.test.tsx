import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import App from "./App";

/**
 * Pre-populate localStorage with a valid session so the AuthProvider
 * hydrates into `authenticated` on first render. Used by tests that
 * exercise gated routes (upload, favorites, repositories).
 */
function seedSession() {
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
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders the home showcase with the persistent brand and sign-in affordance", () => {
    window.history.pushState(null, "", "/");

    const { container } = render(<App />);

    expect(screen.getByRole("navigation", { name: /musehub navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /musehub home/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /profile menu/i })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /musehub home/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/primary sections/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/figment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/about/i)).not.toBeInTheDocument();
    expect(screen.getByText(/open-source, non-commercial homage to variant/i)).toBeInTheDocument();
    expect(screen.getByText(/if your open-source work appears here/i)).toBeInTheDocument();
    expect(container.querySelector(".home-shell")).toBeInTheDocument();
  });

  it("dissolves the home layer while revealing the community experience", async () => {
    const user = userEvent.setup();
    window.history.pushState(null, "", "/");

    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: /enter musehub community/i }));

    expect(window.location.pathname).toBe("/community");
    expect(
      await screen.findByRole("region", { name: /musehub community feed/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/harnesskit agent cards high fidelity demo/i)).toBeInTheDocument();
    expect(screen.getByText(/antimetal hero — 1:1 replica/i)).toBeInTheDocument();
    expect(screen.getAllByTitle(/preview/i)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /open in new window/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /copy prompt/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /download code zip/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /view source project/i })).toHaveLength(2);
    expect(screen.getByRole("searchbox", { name: /search by title or tag/i })).toBeInTheDocument();
    expect(container.querySelector(".dissolve-transition-layer")).toBeInTheDocument();
    expect(container.querySelector(".is-rail-revealing")).toBeInTheDocument();
    expect(container.querySelector(".is-community-entering")).toBeInTheDocument();
  });

  it("uses the shared page transition frame for rail navigation", async () => {
    seedSession();
    const user = userEvent.setup();
    window.history.pushState(null, "", "/community");

    const { container } = render(<App />);

    await screen.findByRole("region", { name: /musehub community feed/i });
    await user.click(screen.getByRole("button", { name: /favorites/i }));

    expect(window.location.pathname).toBe("/favorites");
    expect(
      await screen.findByRole("region", { name: /favorites page placeholder/i }),
    ).toBeInTheDocument();
    expect(container.querySelector(".page-transition-frame")).toHaveAttribute(
      "data-page-id",
      "favorites",
    );
  });

  it("keeps the side rail ordered by primary navigation", async () => {
    window.history.pushState(null, "", "/community");

    render(<App />);

    await screen.findByRole("region", { name: /musehub community feed/i });

    const primarySections = screen.getByLabelText(/primary sections/i);
    const sectionLabels = Array.from(primarySections.querySelectorAll("button")).map((button) =>
      button.getAttribute("aria-label"),
    );

    expect(sectionLabels).toEqual(["Community", "Upload", "Favorites", "Repositories"]);
  });

  it("renders the minimal upload workspace that hands off to an agent", async () => {
    window.history.pushState(null, "", "/upload");

    render(<App />);

    expect(
      await screen.findByRole("region", { name: /musehub upload workspace/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/hand it/i);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/your agent/i);
    expect(screen.queryByText(/manual pr package/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy agent prompt/i })).toBeInTheDocument();
    const prompt = screen.getByLabelText(/agent upload prompt/i, { selector: "code" });
    expect(prompt.textContent).toContain("/upload/skill.md");

    expect(screen.getByRole("button", { name: /^cursor$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^claude code$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^codex$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^gemini cli$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^copilot$/i })).toBeInTheDocument();
  });

  it("navigates from the rail sign-in affordance to the sign-in page", async () => {
    const user = userEvent.setup();
    window.history.pushState(null, "", "/community");

    render(<App />);

    await screen.findByRole("region", { name: /musehub community feed/i });
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(window.location.pathname).toBe("/sign-in");
    expect(await screen.findByRole("region", { name: /sign in to musehub/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sign in or sign up/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email address/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with email/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/primary sections/i)).not.toBeInTheDocument();
  });

  it("signs in with Google mock and swaps the rail affordance for the profile menu", async () => {
    const user = userEvent.setup();
    window.history.pushState(null, "", "/sign-in");

    render(<App />);

    await screen.findByRole("heading", { name: /sign in or sign up/i });
    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(
      await screen.findByRole("region", { name: /musehub community feed/i }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/community");
    expect(await screen.findByRole("button", { name: /profile menu/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^sign in$/i })).not.toBeInTheDocument();
  });

  it("signs in with email and logs out from the profile menu", async () => {
    const user = userEvent.setup();
    window.history.pushState(null, "", "/sign-in");

    render(<App />);

    await screen.findByRole("heading", { name: /sign in or sign up/i });
    await user.type(screen.getByRole("textbox", { name: /email address/i }), "ada@musehub.dev");
    await user.click(screen.getByRole("button", { name: /continue with email/i }));

    const profileButton = await screen.findByRole("button", { name: /ada profile menu/i });
    await user.click(profileButton);
    await user.click(await screen.findByRole("menuitem", { name: /log out/i }));

    expect(await screen.findByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /profile menu/i })).not.toBeInTheDocument();
  });

  it("redirects anonymous visitors from a protected route to /sign-in", async () => {
    window.history.pushState(null, "", "/favorites");

    render(<App />);

    expect(await screen.findByRole("heading", { name: /sign in or sign up/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/sign-in");
    expect(
      screen.queryByRole("region", { name: /favorites page placeholder/i }),
    ).not.toBeInTheDocument();
  });

  it("lets anonymous visitors reach the public upload workspace", async () => {
    window.history.pushState(null, "", "/upload");

    render(<App />);

    expect(
      await screen.findByRole("region", { name: /musehub upload workspace/i }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/upload");
    // Rail still shows the anonymous affordance, confirming we didn't
    // silently upgrade the visitor to an authenticated session.
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });
});
