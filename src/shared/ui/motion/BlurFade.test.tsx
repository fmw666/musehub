import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BlurFade } from "./BlurFade";

describe("BlurFade", () => {
  it("renders its children so the accessibility tree stays unchanged", () => {
    render(
      <BlurFade>
        <h1>Muse headline</h1>
      </BlurFade>,
    );

    expect(screen.getByRole("heading", { name: "Muse headline" })).toBeInTheDocument();
  });

  it("forwards className to the wrapper element", () => {
    render(
      <BlurFade className="test-wrapper">
        <span>inner</span>
      </BlurFade>,
    );

    const inner = screen.getByText("inner");
    const wrapper = inner.parentElement;

    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveClass("test-wrapper");
  });
});
