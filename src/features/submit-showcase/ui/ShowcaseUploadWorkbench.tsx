import { type ChangeEvent, useMemo, useState } from "react";
import { Button, Card, Chip } from "@heroui/react";

import {
  showcaseUploadCsp,
  showcaseUploadInterfaceName,
  showcaseUploadRoot,
  showcaseUploadSkillPath,
} from "@/entities/upload/model/showcase-upload-schema";
import type { ShowcaseUploadMetadata } from "@/entities/upload/model/types";

const defaultHtmlBody = '<div id="root"></div>';
const defaultCss = "body { margin: 0; background: #050505; color: #f5f5f0; }";
const defaultJs = "document.getElementById('root').textContent = 'MuseHub showcase ready';";

type PackageState = {
  title: string;
  sourceUrl: string;
  sourcePlatform: string;
  tags: string;
  htmlBody: string;
  css: string;
  js: string;
};

type GeneratedPackage = {
  directory: string;
  indexHtml: string;
  metadataJson: string;
  pullRequestBody: string;
};

const initialPackageState: PackageState = {
  title: "My Community Showcase",
  sourceUrl: "https://example.com/source",
  sourcePlatform: "github",
  tags: "ui, demo",
  htmlBody: defaultHtmlBody,
  css: defaultCss,
  js: defaultJs,
};

export function ShowcaseUploadWorkbench() {
  const [packageState, setPackageState] = useState(initialPackageState);
  const [generatedPackage, setGeneratedPackage] = useState<GeneratedPackage | null>(null);
  const slug = useMemo(() => toKebabCase(packageState.title), [packageState.title]);
  const skillUrl = `${window.location.origin}${showcaseUploadSkillPath}`;
  const agentPrompt = `Read ${skillUrl} and use ${showcaseUploadInterfaceName} to prepare a MuseHub community showcase PR for ${packageState.sourceUrl}. Title: ${packageState.title}. Tags: ${normalizeTags(packageState.tags).join(", ")}.`;

  const updatePackageState =
    (field: keyof PackageState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setPackageState((current) => ({ ...current, [field]: event.target.value }));
    };

  const copyAgentPrompt = () => {
    void navigator.clipboard.writeText(agentPrompt);
  };

  const generatePackage = async () => {
    const safeSlug = slug || "community-showcase";
    const indexHtml = createIndexHtml(packageState.title, packageState.htmlBody);
    const css = packageState.css;
    const js = packageState.js;
    const metadata: ShowcaseUploadMetadata = {
      id: safeSlug,
      title: packageState.title.trim() || "Untitled Showcase",
      tags: normalizeTags(packageState.tags),
      sourceUrl: packageState.sourceUrl.trim(),
      sourcePlatform: packageState.sourcePlatform.trim() || "unknown",
      originalFile: packageState.sourceUrl.trim(),
      assetPath: `/community-showcases/${safeSlug}/index.html`,
      importedAt: new Date().toISOString().slice(0, 10),
      files: {
        "index.html": await createIntegrity(indexHtml),
        "styles.css": await createIntegrity(css),
        "script.js": await createIntegrity(js),
      },
    };

    const directory = `${showcaseUploadRoot}/${safeSlug}`;
    setGeneratedPackage({
      directory,
      indexHtml,
      metadataJson: JSON.stringify(metadata, null, 2),
      pullRequestBody: createPullRequestBody(directory, metadata),
    });
  };

  return (
    <div className="upload-workbench">
      <Card className="upload-panel upload-panel-primary">
        <Card.Content className="upload-panel-body">
          <div className="upload-panel-heading">
            <Chip className="stage-chip upload-chip" variant="bordered">
              Agent Skill
            </Chip>
            <span className="upload-step-mark">01</span>
          </div>
          <div className="upload-card-title">
            <p className="upload-eyebrow">{showcaseUploadInterfaceName}</p>
            <h2>让 Agent 读取上传说明</h2>
            <p>
              复制这段话给任意编码 Agent。它会读取静态 skill，按 schema 生成展示资产、更新社区数据、
              运行安全校验并提交 PR。
            </p>
          </div>
          <textarea
            aria-label="Agent upload prompt"
            className="upload-textarea"
            readOnly
            rows={5}
            value={agentPrompt}
          />
          <div className="upload-actions">
            <Button
              as="a"
              className="upload-secondary-action"
              href={showcaseUploadSkillPath}
              target="_blank"
            >
              Open skill.md
            </Button>
            <Button className="upload-primary-action" onPress={copyAgentPrompt}>
              Copy agent prompt
            </Button>
          </div>
          <div className="upload-flow-strip" aria-hidden="true">
            <span>read skill.md</span>
            <span>write files</span>
            <span>open PR</span>
          </div>
        </Card.Content>
      </Card>

      <Card className="upload-panel upload-panel-manual">
        <Card.Content className="upload-panel-body">
          <div className="upload-panel-heading">
            <Chip className="stage-chip upload-chip" variant="bordered">
              Manual PR Package
            </Chip>
            <span className="upload-step-mark">02</span>
          </div>
          <div className="upload-card-title">
            <p className="upload-eyebrow">pure frontend handoff</p>
            <h2>手动生成 PR 提交包</h2>
            <p>前端不会直接写仓库；这里生成目标目录、HTML shell、metadata 和 PR checklist。</p>
          </div>

          <div className="upload-form-grid">
            <label className="upload-field">
              <span>Title</span>
              <input value={packageState.title} onChange={updatePackageState("title")} />
            </label>
            <label className="upload-field">
              <span>Source platform</span>
              <input
                value={packageState.sourcePlatform}
                onChange={updatePackageState("sourcePlatform")}
              />
            </label>
            <label className="upload-field upload-form-wide">
              <span>Source URL</span>
              <input value={packageState.sourceUrl} onChange={updatePackageState("sourceUrl")} />
            </label>
            <label className="upload-field upload-form-wide">
              <span>Tags</span>
              <input value={packageState.tags} onChange={updatePackageState("tags")} />
            </label>
          </div>

          <div className="upload-dropzone" aria-label="Generated target directory">
            <span>Target directory</span>
            <strong>
              {showcaseUploadRoot}/{slug || "community-showcase"}
            </strong>
          </div>

          <label className="upload-field">
            <span>HTML body</span>
            <textarea
              rows={3}
              value={packageState.htmlBody}
              onChange={updatePackageState("htmlBody")}
            />
          </label>
          <label className="upload-field">
            <span>CSS</span>
            <textarea rows={3} value={packageState.css} onChange={updatePackageState("css")} />
          </label>
          <label className="upload-field">
            <span>JS</span>
            <textarea rows={3} value={packageState.js} onChange={updatePackageState("js")} />
          </label>

          <Button className="upload-primary-action" onPress={() => void generatePackage()}>
            Generate PR package
          </Button>
        </Card.Content>
      </Card>

      <Card className="upload-panel upload-output-panel">
        <Card.Content className="upload-panel-body">
          <div className="upload-panel-heading">
            <Chip className="stage-chip upload-chip" variant="bordered">
              Repository Handoff
            </Chip>
            <span className="upload-step-mark">03</span>
          </div>
          {generatedPackage ? (
            <div className="upload-output-grid">
              <p className="upload-eyebrow">{generatedPackage.directory}</p>
              <textarea
                aria-label="Generated index html"
                className="upload-textarea"
                readOnly
                rows={8}
                value={generatedPackage.indexHtml}
              />
              <textarea
                aria-label="Generated metadata json"
                className="upload-textarea"
                readOnly
                rows={8}
                value={generatedPackage.metadataJson}
              />
              <textarea
                aria-label="Generated pull request checklist"
                className="upload-textarea"
                readOnly
                rows={8}
                value={generatedPackage.pullRequestBody}
              />
            </div>
          ) : (
            <div className="upload-empty-output">
              <h2>生成后会显示文件和 PR checklist</h2>
              <p>
                资产落点固定为 <code>public/community-showcases/&lt;id&gt;</code>，并由
                <code> npm run validate:showcases</code> 检查安全和完整性。
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

function toKebabCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeTags(value: string) {
  const tags = value
    .split(",")
    .map((tag) => toKebabCase(tag))
    .filter(Boolean);

  return tags.length > 0 ? tags.slice(0, 12) : ["showcase"];
}

function createIndexHtml(title: string, htmlBody: string) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="${showcaseUploadCsp}" />
    <title>${escapeHtml(title.trim() || "MuseHub Showcase")}</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    ${htmlBody.trim() || defaultHtmlBody}
    <script src="./script.js"></script>
  </body>
</html>
`;
}

async function createIntegrity(content: string) {
  const bytes = new TextEncoder().encode(content);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const sha256 = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return { sha256, bytes: bytes.byteLength };
}

function createPullRequestBody(directory: string, metadata: ShowcaseUploadMetadata) {
  return `## Upload target
${directory}

## Required files
- index.html
- styles.css
- script.js
- metadata.json

## Community catalog entry
Add an item to src/entities/showcase/model/showcase-items.ts:
- id: ${metadata.id}
- title: ${metadata.title}
- source: ${metadata.sourcePlatform}
- assetPath: ${metadata.assetPath}

## Validation
- npm run validate:showcases
- npm run lint
- npm run test
- npm run build

## Notes
This is a static frontend upload. Persisting the asset means committing these files and opening a GitHub PR.`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
