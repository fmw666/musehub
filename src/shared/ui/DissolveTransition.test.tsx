import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DissolveTransition } from "./DissolveTransition";

afterEach(() => {
  vi.useRealTimers();
});

describe("DissolveTransition", () => {
  it("renders an inert exiting layer while active", () => {
    render(
      <DissolveTransition durationMs={240} isActive onExited={() => undefined}>
        <div>Leaving surface</div>
      </DissolveTransition>,
    );

    const layer = screen.getByText("Leaving surface").parentElement;

    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).toHaveAttribute("data-transition-state", "exiting");
    expect(layer).toHaveStyle({ "--dissolve-duration": "240ms" });
  });

  it("calls onExited after the configured duration", () => {
    vi.useFakeTimers();
    const onExited = vi.fn();

    render(
      <DissolveTransition durationMs={320} isActive onExited={onExited}>
        <div>Leaving surface</div>
      </DissolveTransition>,
    );

    expect(onExited).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(319);
    });
    expect(onExited).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("does not render when inactive", () => {
    const { container } = render(
      <DissolveTransition durationMs={240} isActive={false} onExited={() => undefined}>
        <div>Leaving surface</div>
      </DissolveTransition>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
