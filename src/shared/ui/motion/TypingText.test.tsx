import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mockReducedMotion, resetReducedMotionMock } from "@/test/reduced-motion";

import { TypingText } from "./TypingText";

afterEach(() => {
  vi.useRealTimers();
  resetReducedMotionMock();
});

describe("TypingText", () => {
  it("exposes the full label for assistive technology", () => {
    render(<TypingText text={["hello", "world"]} showCursor={false} />);

    expect(screen.getByLabelText("hello / world")).toBeInTheDocument();
  });

  it("types the string one character at a time", () => {
    vi.useFakeTimers();

    render(<TypingText text="ab" typingSpeedMs={20} showCursor={false} />);

    const node = screen.getByLabelText("ab");

    expect(node.textContent).toBe("");

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(node.textContent).toBe("a");

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(node.textContent).toBe("ab");
  });

  it("renders the full first entry immediately under reduced motion", async () => {
    mockReducedMotion(true);

    // Import the component *after* the mock is installed so it picks up the
    // stubbed `useReducedMotion`. The top-level import above is intentional
    // for the other tests that exercise the normal motion branch.
    const { TypingText: ReducedTypingText } = await import("./TypingText");

    render(<ReducedTypingText text={["hello", "world"]} showCursor={true} />);

    // Reduced-motion branch short-circuits the incremental typing loop, and
    // the caret is gated by `!reduced`, so both disappear together and the
    // visible content is exactly the first entry.
    await waitFor(() => {
      const node = screen.getByLabelText("hello / world");
      expect(node.textContent).toBe("hello");
    });
  });
});
