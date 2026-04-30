import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { ArrowUpRight, Check, Copy } from "lucide-react";

import { showcaseUploadSkillPath } from "@/entities/upload/model/showcase-upload-schema";

export function ShowcaseUploadWorkbench() {
  const [copied, setCopied] = useState(false);

  const skillUrl =
    typeof window === "undefined"
      ? showcaseUploadSkillPath
      : `${window.location.origin}${showcaseUploadSkillPath}`;

  const agentPrompt = `Read ${skillUrl} and follow it to publish a MuseHub community showcase. Ask me for anything you need (title, source URL, tags, assets) before committing, then open a pull request.`;

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyPrompt = () => {
    void navigator.clipboard.writeText(agentPrompt).then(() => setCopied(true));
  };

  return (
    <div className="upload-workbench">
      <article className="upload-card" aria-label="Agent upload prompt">
        <span className="upload-card-rail" aria-hidden="true" />
        <header className="upload-card-heading">
          <span className="upload-card-eyebrow">
            <span className="upload-card-eyebrow-dot" aria-hidden="true" />
            prompt · v1
          </span>
          <span className="upload-card-counter" aria-hidden="true">
            {agentPrompt.length} chars
          </span>
        </header>
        <code className="upload-prompt-preview" aria-label="Agent upload prompt">
          {agentPrompt}
          <span className="upload-prompt-caret" aria-hidden="true" />
        </code>
        <div className="upload-actions">
          <Button
            className="upload-primary-action"
            onPress={copyPrompt}
            startContent={
              <span className="upload-icon-swap" data-active={copied}>
                <Copy aria-hidden="true" className="upload-icon-idle" size={14} />
                <Check aria-hidden="true" className="upload-icon-done" size={14} />
              </span>
            }
          >
            {copied ? "Copied — paste it into your agent" : "Copy agent prompt"}
          </Button>
          <Button
            as="a"
            className="upload-secondary-action"
            href={showcaseUploadSkillPath}
            target="_blank"
            rel="noreferrer"
            endContent={<ArrowUpRight aria-hidden="true" size={14} />}
          >
            View skill.md
          </Button>
        </div>
      </article>
    </div>
  );
}
