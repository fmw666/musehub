import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the home showcase with the persistent brand and user rail", () => {
    window.history.pushState(null, "", "/");

    const { container } = render(<App />);

    expect(screen.getByRole("navigation", { name: /musehub navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /musehub home/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /profile menu/i })).toBeInTheDocument();
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
    expect(screen.getAllByTitle(/preview/i)).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /open in new window/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /copy prompt/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /download code zip/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /view source project/i })).toHaveLength(1);
    expect(screen.getByRole("searchbox", { name: /search by title or tag/i })).toBeInTheDocument();
    expect(container.querySelector(".dissolve-transition-layer")).toBeInTheDocument();
    expect(container.querySelector(".is-rail-revealing")).toBeInTheDocument();
    expect(container.querySelector(".is-community-entering")).toBeInTheDocument();
  });

  it("uses the shared page transition frame for rail navigation", async () => {
    const user = userEvent.setup();
    window.history.pushState(null, "", "/community");

    const { container } = render(<App />);

    await screen.findByRole("region", { name: /musehub community feed/i });
    await user.click(screen.getByRole("button", { name: /favorites/i }));

    expect(window.location.pathname).toBe("/favorites");
    expect(screen.getByRole("region", { name: /favorites page placeholder/i })).toBeInTheDocument();
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
});
