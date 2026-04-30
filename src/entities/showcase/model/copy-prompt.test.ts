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

  it("returns undefined when the item is structurally invalid at runtime", () => {
    const broken = { ...showcase, title: 123 as unknown as string };
    expect(createShowcaseCopyPrompt(broken, "https://musehub.example")).toBeUndefined();
  });

  it("returns undefined when neither linkUrl nor assetPath is present", () => {
    const { assetPath: _assetPath, ...rest } = showcase;
    void _assetPath;
    const item = rest as typeof showcase;
    expect(createShowcaseCopyPrompt(item, "https://musehub.example")).toBeUndefined();
  });

  it("omits the tags line when tags are missing", () => {
    const { tags: _tags, ...rest } = showcase;
    void _tags;
    const item = rest as typeof showcase;
    const prompt = createShowcaseCopyPrompt(item, "https://musehub.example");
    expect(prompt).toBeDefined();
    expect(prompt).not.toContain("Tags:");
  });
});
