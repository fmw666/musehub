import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MotionHighlight } from "./MotionHighlight";

describe("MotionHighlight", () => {
  it("renders nothing when rect is null", () => {
    const { container } = render(<MotionHighlight rect={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders an aria-hidden element with the supplied className when a rect is provided", () => {
    const { container } = render(
      <MotionHighlight className="test-highlight" rect={{ x: 10, y: 20, width: 32, height: 32 }} />,
    );

    const node = container.querySelector(".test-highlight");
    expect(node).not.toBeNull();
    expect(node).toHaveAttribute("aria-hidden", "true");
  });
});
