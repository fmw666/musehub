import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { ShowcaseItem } from "@/entities/showcase/model/types";
import { GalleryWall } from "./GalleryWall";

const wallItems: readonly ShowcaseItem[] = [
  {
    id: "agent-cards",
    title: "Agent Cards",
    source: "GitHub",
    kind: "Demo",
    tone: "stack",
    span: "wide",
    status: "new",
    tags: ["agent", "cards", "ui"],
  },
  {
    id: "metrics-console",
    title: "Metrics Console",
    source: "Community",
    kind: "Dashboard",
    tone: "mint",
    span: "medium",
    status: "featured",
    tags: ["analytics", "dashboard"],
  },
];

describe("GalleryWall", () => {
  it("filters showcases by title search", async () => {
    const user = userEvent.setup();

    render(<GalleryWall items={wallItems} />);

    await user.type(screen.getByRole("searchbox", { name: /search by title or tag/i }), "metrics");

    expect(screen.getByText("Metrics Console")).toBeInTheDocument();
    expect(screen.queryByText("Agent Cards")).not.toBeInTheDocument();
  });

  it("expands tags and filters showcases by selected tag", async () => {
    const user = userEvent.setup();

    render(<GalleryWall items={wallItems} />);

    await user.click(screen.getByRole("button", { name: /expand tag filters/i }));
    await user.click(screen.getByRole("button", { name: "dashboard" }));

    expect(screen.getByText("Metrics Console")).toBeInTheDocument();
    expect(screen.queryByText("Agent Cards")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/selected tags/i)).toHaveTextContent("dashboard");
  });

  it("clears active search and tag filters", async () => {
    const user = userEvent.setup();

    render(<GalleryWall items={wallItems} />);

    await user.type(screen.getByRole("searchbox", { name: /search by title or tag/i }), "cards");
    await user.click(screen.getByRole("button", { name: /expand tag filters/i }));
    await user.click(screen.getByRole("button", { name: "dashboard" }));
    await user.click(screen.getByRole("button", { name: /clear search filters/i }));

    expect(screen.getByText("Agent Cards")).toBeInTheDocument();
    expect(screen.getByText("Metrics Console")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /search by title or tag/i })).toHaveValue("");
  });
});
