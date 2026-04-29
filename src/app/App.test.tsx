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
    expect(screen.getByRole("button", { name: /guest profile/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /musehub home/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/primary sections/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/figment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/about/i)).not.toBeInTheDocument();
    expect(container.querySelector(".home-shell")).toBeInTheDocument();
  });

  it("dissolves the home layer while revealing the community experience", async () => {
    const user = userEvent.setup();
    window.history.pushState(null, "", "/");

    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: /enter musehub community/i }));

    expect(window.location.pathname).toBe("/community");
    expect(screen.getByRole("region", { name: /musehub community feed/i })).toBeInTheDocument();
    expect(screen.getByText(/harnesskit agent cards high fidelity demo/i)).toBeInTheDocument();
    expect(screen.getAllByTitle(/preview/i)).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /new page/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /copy prompt/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /download zip/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /open link/i })).toHaveLength(1);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(container.querySelector(".dissolve-transition-layer")).toBeInTheDocument();
    expect(container.querySelector(".is-rail-revealing")).toBeInTheDocument();
    expect(container.querySelector(".is-community-entering")).toBeInTheDocument();
  });

  it("uses the shared page transition frame for rail navigation", async () => {
    const user = userEvent.setup();
    window.history.pushState(null, "", "/community");

    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: /favorites/i }));

    expect(window.location.pathname).toBe("/favorites");
    expect(screen.getByRole("region", { name: /favorites page placeholder/i })).toBeInTheDocument();
    expect(container.querySelector(".page-transition-frame")).toHaveAttribute(
      "data-page-id",
      "favorites",
    );
  });

  it("keeps the side rail ordered by primary navigation", () => {
    window.history.pushState(null, "", "/community");

    render(<App />);

    const primarySections = screen.getByLabelText(/primary sections/i);
    const sectionLabels = Array.from(primarySections.querySelectorAll("button")).map((button) =>
      button.getAttribute("aria-label"),
    );

    expect(sectionLabels).toEqual(["Community", "Upload", "Favorites", "Repositories"]);
  });

  it("renders the upload workspace with agent and manual PR flows", () => {
    window.history.pushState(null, "", "/upload");

    render(<App />);

    expect(screen.getByRole("region", { name: /musehub upload workspace/i })).toBeInTheDocument();
    expect(screen.getByText(/upload community assets/i)).toBeInTheDocument();
    expect(screen.getByText(/agent skill/i)).toBeInTheDocument();
    expect(screen.getByText(/manual pr package/i)).toBeInTheDocument();
    expect(screen.getByLabelText<HTMLTextAreaElement>(/agent upload prompt/i).value).toContain(
      "/upload/skill.md",
    );
  });
});
