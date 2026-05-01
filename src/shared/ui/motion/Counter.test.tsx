import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Counter } from "./Counter";

describe("Counter", () => {
  it("renders the numeric value as accessible text", () => {
    render(<Counter value={42} />);

    const node = screen.getByLabelText("42");
    expect(node.textContent).toBe("42");
  });

  it("accepts a custom aria-label for screen readers", () => {
    render(<Counter value={7} aria-label="7 showcases" />);

    expect(screen.getByLabelText("7 showcases")).toBeInTheDocument();
  });

  it("snaps to the target value on first mount by default", () => {
    render(<Counter value={150} />);

    const node = screen.getByLabelText("150");
    expect(node.textContent).toBe("150");
  });

  it("accepts startFromZero without crashing and keeps the target value as the aria-label", () => {
    render(<Counter value={150} startFromZero />);

    // aria-label still reports the target value regardless of the initial
    // tween origin; this is the assistive-tech contract. The visible digit
    // is controlled by motion's tween scheduler, which is timing-dependent
    // under jsdom, so we don't assert its instantaneous value here.
    expect(screen.getByLabelText("150")).toBeInTheDocument();
  });
});
