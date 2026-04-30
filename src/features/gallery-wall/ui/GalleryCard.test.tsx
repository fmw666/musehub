import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ShowcaseItem } from "@/entities/showcase/model/types";
import { GalleryCard } from "./GalleryCard";

const baseItem: ShowcaseItem = {
  id: "sample-showcase",
  title: "Sample Showcase",
  source: "GitHub",
  kind: "Demo",
  tone: "stack",
  span: "wide",
  status: "new",
  assetPath: "/community-showcases/sample/index.html",
};

describe("GalleryCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the source project when a source URL is available", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <GalleryCard
        item={{
          ...baseItem,
          linkUrl: "/community-showcases/sample/index.html",
          sourceUrl: "https://github.com/RealZST/HarnessKit",
        }}
        priority={0}
      />,
    );

    await user.click(screen.getByRole("button", { name: /view source project/i }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://github.com/RealZST/HarnessKit",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("hides the source project action when no source URL is available", () => {
    render(<GalleryCard item={baseItem} priority={0} />);

    expect(screen.queryByRole("button", { name: /view source project/i })).not.toBeInTheDocument();
  });
});
