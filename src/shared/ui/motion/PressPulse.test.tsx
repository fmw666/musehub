import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { mockReducedMotion, resetReducedMotionMock } from "@/test/reduced-motion";

import { PressPulse } from "./PressPulse";

afterEach(() => {
  resetReducedMotionMock();
});

function Harness() {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setCopied((prev) => !prev)}>
        toggle
      </button>
      <PressPulse triggerKey={copied} overlayClassName="pulse-overlay">
        <span>child</span>
      </PressPulse>
    </div>
  );
}

describe("PressPulse", () => {
  it("does not render an overlay on first mount", () => {
    const { container } = render(
      <PressPulse triggerKey={false} overlayClassName="pulse-overlay">
        <span>child</span>
      </PressPulse>,
    );

    expect(container.querySelector(".pulse-overlay")).toBeNull();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("renders an overlay when the trigger changes", async () => {
    const { container, rerender } = render(
      <PressPulse triggerKey={false} overlayClassName="pulse-overlay">
        <span>child</span>
      </PressPulse>,
    );

    rerender(
      <PressPulse triggerKey={true} overlayClassName="pulse-overlay">
        <span>child</span>
      </PressPulse>,
    );

    await waitFor(() => {
      expect(container.querySelector(".pulse-overlay")).not.toBeNull();
    });
    expect(container.querySelector(".pulse-overlay")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not intercept clicks on the wrapped content", async () => {
    const { container } = render(<Harness />);

    const toggle = screen.getByText("toggle");
    act(() => {
      toggle.click();
    });

    await waitFor(() => {
      expect(container.querySelector(".pulse-overlay")).not.toBeNull();
    });
    const overlay = container.querySelector<HTMLElement>(".pulse-overlay");
    expect(overlay?.style.pointerEvents).toBe("none");
  });

  it("renders no overlay under reduced motion, even when the trigger changes", async () => {
    mockReducedMotion(true);

    // Import the component after the mock so it sees the stubbed hook.
    const { PressPulse: ReducedPressPulse } = await import("./PressPulse");

    const { container, rerender } = render(
      <ReducedPressPulse triggerKey={false} overlayClassName="pulse-overlay">
        <span>child</span>
      </ReducedPressPulse>,
    );

    rerender(
      <ReducedPressPulse triggerKey={true} overlayClassName="pulse-overlay">
        <span>child</span>
      </ReducedPressPulse>,
    );

    // Under reduced motion the <AnimatePresence> block is never rendered, so
    // the overlay must stay absent regardless of the trigger flip.
    await waitFor(() => {
      expect(container.querySelector(".pulse-overlay")).toBeNull();
    });
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
