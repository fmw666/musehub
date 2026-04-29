import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders planned page placeholders from route contracts", () => {
    window.history.pushState(null, "", "/");

    render(<App />);

    expect(screen.getByRole("navigation", { name: /musehub navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /musehub page placeholder/i })).toBeInTheDocument();
  });

  it("navigates to the community experience without a page reload", async () => {
    const user = userEvent.setup();
    window.history.pushState(null, "", "/");

    render(<App />);

    await user.click(screen.getByRole("button", { name: /community/i }));

    expect(window.location.pathname).toBe("/community");
    expect(screen.getByRole("region", { name: /musehub community feed/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
