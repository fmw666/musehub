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

  it("copies a generated agent prompt for the deployed asset", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<GalleryCard item={baseItem} priority={0} />);

    await user.click(screen.getByRole("button", { name: /copy prompt/i }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(
        "HTML URL: http://localhost:3000/community-showcases/sample/index.html",
      ),
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(
        "CSS URL: http://localhost:3000/community-showcases/sample/styles.css",
      ),
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(
        "JavaScript URL: http://localhost:3000/community-showcases/sample/script.js",
      ),
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("current project architecture, technology stack"),
    );
  });

  it("switches the copy prompt button to the success label after copying", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<GalleryCard item={baseItem} priority={0} />);

    await user.click(screen.getByRole("button", { name: /copy prompt/i }));

    await screen.findByRole("button", { name: /prompt copied/i });
  });

  it("shows an environment chip when the showcase declares one", () => {
    render(<GalleryCard item={{ ...baseItem, environment: "react" }} priority={0} />);

    expect(screen.getByLabelText(/source environment: react/i)).toBeInTheDocument();
  });

  it("triggers the legacy single-zip download when only zipPath is provided", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <GalleryCard
        item={{
          ...baseItem,
          zipPath: "/community-zips/sample.zip",
        }}
        priority={0}
      />,
    );

    await user.click(screen.getByRole("button", { name: /download code zip/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("renders a download menu when multiple downloads are declared", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <GalleryCard
        item={{
          ...baseItem,
          environment: "react",
          downloads: [
            {
              kind: "react",
              label: "React bundle (zip)",
              url: "/community-zips/sample-react.zip",
            },
            {
              kind: "vanilla",
              label: "Vanilla static (zip)",
              url: "/community-zips/sample-vanilla.zip",
            },
          ],
        }}
        priority={0}
      />,
    );

    const trigger = screen.getByRole("button", { name: /download options/i });
    await user.click(trigger);

    const menuItem = await screen.findByRole("menuitem", { name: /vanilla static/i });
    await user.click(menuItem);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("falls back to a single Download code ZIP button when only one download is declared", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <GalleryCard
        item={{
          ...baseItem,
          downloads: [
            {
              kind: "react",
              label: "React bundle (zip)",
              url: "/community-zips/sample-react.zip",
            },
          ],
        }}
        priority={0}
      />,
    );

    expect(screen.queryByRole("button", { name: /download options/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /download code zip/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
