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
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(container.querySelector(".dissolve-transition-layer")).toBeInTheDocument();
    expect(container.querySelector(".is-rail-revealing")).toBeInTheDocument();
    expect(container.querySelector(".is-community-entering")).toBeInTheDocument();
  });
});
