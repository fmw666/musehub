import { describe, expect, it } from "vitest";

import type { ShowcaseItem } from "./types";
import { createShowcaseCopyPrompt } from "./copy-prompt";

const showcase: ShowcaseItem = {
  id: "sample-showcase",
  title: "Sample Showcase",
  source: "GitHub",
  kind: "Demo",
  tone: "stack",
  span: "wide",
  status: "new",
  tags: ["ui", "demo"],
  assetPath: "/community-showcases/sample/index.html",
  sourceUrl: "https://github.com/example/sample",
};

describe("createShowcaseCopyPrompt", () => {
  it("builds a reusable agent handoff prompt with the deployed preview URL", () => {
    const prompt = createShowcaseCopyPrompt(showcase, "https://musehub.example");

    expect(prompt).toContain("Showcase title: Sample Showcase");
    expect(prompt).toContain(
      "Preview URL: https://musehub.example/community-showcases/sample/index.html",
    );
    expect(prompt).toContain("deployed project domain plus the asset route");
    expect(prompt).toContain("current project architecture, technology stack");
    expect(prompt).toContain("ask the user for clarification before proceeding");
  });
});
