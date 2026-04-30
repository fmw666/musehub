import { Chip } from "@heroui/react";

import { ShowcaseUploadWorkbench } from "@/features/submit-showcase/ui/ShowcaseUploadWorkbench";
import type { PageContract } from "@/shared/contracts/page";
import { StageMeta } from "@/widgets/app-shell/ui/StageMeta";

type UploadPageProps = {
  page: PageContract;
};

const runtimeAgents = ["cursor", "claude", "codex", "copilot", "continue", "aider"] as const;

export function UploadPage({ page }: UploadPageProps) {
  return (
    <section className="upload-stage" aria-label="MuseHub upload workspace">
      <StageMeta page={page} />

      <div className="upload-atmos" aria-hidden="true">
        <span className="upload-atmos-grid" />
        <span className="upload-atmos-glow upload-atmos-glow-acid" />
        <span className="upload-atmos-glow upload-atmos-glow-iris" />
        <span className="upload-atmos-signature">agent</span>
      </div>

      <header className="upload-hero">
        <div className="upload-hero-topline">
          <Chip className="upload-hero-chip" variant="bordered" size="sm">
            /upload
          </Chip>
          <span className="upload-hero-meta" aria-hidden="true">
            <span className="upload-hero-meta-dot" />
            awaiting your agent
          </span>
        </div>
        <h1 className="upload-hero-headline">
          <span className="upload-hero-line">Hand it</span>
          <span className="upload-hero-line">
            to <em className="upload-hero-accent">your agent</em>
            <span className="upload-hero-period" aria-hidden="true">
              .
            </span>
          </span>
        </h1>
        <p className="upload-hero-lede">
          这个页面不收集信息。复制 prompt,交给 Cursor、Claude Code 或任意编码 Agent —— 它会读
          skill、来问你要素、然后提交 PR。
        </p>
      </header>

      <ShowcaseUploadWorkbench />

      <footer className="upload-stage-footer" aria-hidden="true">
        <div className="upload-stage-footer-left">
          <span className="upload-stage-footer-label">runtime</span>
          <span className="upload-stage-footer-value">musehub://agent.upload.v1</span>
        </div>
        <ul className="upload-agent-cloud" aria-label="Supported agents">
          {runtimeAgents.map((name) => (
            <li key={name} className="upload-agent-cloud-item">
              {name}
            </li>
          ))}
        </ul>
        <div className="upload-stage-footer-right">
          <span className="upload-stage-footer-label">mode</span>
          <span className="upload-stage-footer-value">hand-off</span>
        </div>
      </footer>
    </section>
  );
}
