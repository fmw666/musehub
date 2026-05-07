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
  it("builds a reusable agent handoff prompt with HTML, CSS, and JS asset URLs", () => {
    const prompt = createShowcaseCopyPrompt(showcase, "https://musehub.example");

    expect(prompt).toContain("Showcase title: Sample Showcase");
    expect(prompt).toContain(
      "HTML URL: https://musehub.example/community-showcases/sample/index.html",
    );
    expect(prompt).toContain(
      "CSS URL: https://musehub.example/community-showcases/sample/styles.css",
    );
    expect(prompt).toContain(
      "JavaScript URL: https://musehub.example/community-showcases/sample/script.js",
    );
    expect(prompt).toContain("current project architecture, technology stack");
    expect(prompt).toContain("ask the user for clarification before proceeding");
  });

  it("describes the default vanilla environment when none is declared", () => {
    const prompt = createShowcaseCopyPrompt(showcase, "https://musehub.example");

    expect(prompt).toContain("Source environment: Vanilla HTML, CSS, and JavaScript");
  });

  it("does not include a repository source line or a generic preview URL label", () => {
    const prompt = createShowcaseCopyPrompt(showcase, "https://musehub.example");

    expect(prompt).toBeDefined();
    expect(prompt).not.toContain("Source project:");
    expect(prompt).not.toContain("Preview URL:");
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

  it("emits a numbered URL list when the showcase declares multiple style and script files", () => {
    const item: ShowcaseItem = {
      ...showcase,
      assets: {
        html: "index.html",
        styles: ["styles.css", "theme.css"],
        scripts: ["vendor.js", "script.js"],
      },
    };

    const prompt = createShowcaseCopyPrompt(item, "https://musehub.example");
    expect(prompt).toBeDefined();

    expect(prompt).toContain("CSS URLs:");
    expect(prompt).toContain("1. https://musehub.example/community-showcases/sample/styles.css");
    expect(prompt).toContain("2. https://musehub.example/community-showcases/sample/theme.css");

    expect(prompt).toContain("JavaScript URLs:");
    expect(prompt).toContain("1. https://musehub.example/community-showcases/sample/vendor.js");
    expect(prompt).toContain("2. https://musehub.example/community-showcases/sample/script.js");
  });

  it("describes the React environment with React-specific guidance", () => {
    const item: ShowcaseItem = { ...showcase, environment: "react" };
    const prompt = createShowcaseCopyPrompt(item, "https://musehub.example");

    expect(prompt).toContain("Source environment: React");
    expect(prompt).toContain("self-contained React build");
    expect(prompt).toContain("component structure, props, state, and effects");
  });

  it("describes the Vue environment with Vue-specific guidance", () => {
    const item: ShowcaseItem = { ...showcase, environment: "vue" };
    const prompt = createShowcaseCopyPrompt(item, "https://musehub.example");

    expect(prompt).toContain("Source environment: Vue");
    expect(prompt).toContain("self-contained Vue build");
  });

  it("lists declared video and image assets under a Media URL block", () => {
    const item: ShowcaseItem = {
      ...showcase,
      assets: {
        html: "index.html",
        styles: ["styles.css"],
        scripts: ["script.js"],
        media: ["video.mp4", "video-mask.avif", "icon.svg"],
      },
    };

    const prompt = createShowcaseCopyPrompt(item, "https://musehub.example");
    expect(prompt).toBeDefined();

    expect(prompt).toContain("Media URLs:");
    expect(prompt).toContain("1. https://musehub.example/community-showcases/sample/video.mp4");
    expect(prompt).toContain(
      "2. https://musehub.example/community-showcases/sample/video-mask.avif",
    );
    expect(prompt).toContain("3. https://musehub.example/community-showcases/sample/icon.svg");
    expect(prompt).toContain("static media assets (video and image files)");
  });

  it("omits the Media URL block when no media is declared", () => {
    const prompt = createShowcaseCopyPrompt(showcase, "https://musehub.example");

    expect(prompt).toBeDefined();
    expect(prompt).not.toContain("Media URL");
    expect(prompt).not.toContain("Media URLs");
  });
});
