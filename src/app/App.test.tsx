import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the community experience shell", () => {
    render(<App />);

    expect(screen.getByRole("navigation", { name: /musehub navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /musehub community feed/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
