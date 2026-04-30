import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseTrigger,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalHeading,
  useOverlayState,
} from "@heroui/react";
import { ArrowUpRight, Check, Copy, FileText } from "lucide-react";

import { showcaseUploadSkillPath } from "@/entities/upload/model/showcase-upload-schema";

type SkillState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; content: string }
  | { status: "error"; message: string };

export function ShowcaseUploadWorkbench() {
  const [copied, setCopied] = useState(false);
  const [skill, setSkill] = useState<SkillState>({ status: "idle" });
  const skillFetchRef = useRef<Promise<void> | null>(null);
  const modalState = useOverlayState();

  const skillUrl =
    typeof window === "undefined"
      ? showcaseUploadSkillPath
      : `${window.location.origin}${showcaseUploadSkillPath}`;

  const agentPrompt = `Read ${skillUrl} and follow it to publish a MuseHub community showcase. Ask me for anything you need (title, source URL, tags, assets) before committing, then open a pull request.`;

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyPrompt = useCallback(() => {
    setCopied(true);
    navigator.clipboard.writeText(agentPrompt).catch((error: unknown) => {
      console.warn("[upload] clipboard copy failed", error);
    });
  }, [agentPrompt]);

  const openSkill = useCallback(() => {
    modalState.open();
    if (skill.status === "ready" || skillFetchRef.current) return;

    setSkill({ status: "loading" });
    skillFetchRef.current = fetch(showcaseUploadSkillPath)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const content = await response.text();
        setSkill({ status: "ready", content });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown error";
        setSkill({ status: "error", message });
      })
      .finally(() => {
        skillFetchRef.current = null;
      });
  }, [modalState, skill.status]);

  const skillBody = useMemo(() => {
    if (skill.status === "ready") {
      return (
        <pre className="upload-skill-modal-code" tabIndex={0}>
          {skill.content}
        </pre>
      );
    }
    if (skill.status === "error") {
      return (
        <div className="upload-skill-modal-state" role="alert">
          <span className="upload-skill-modal-state-label">failed</span>
          <span className="upload-skill-modal-state-hint">{skill.message}</span>
        </div>
      );
    }
    return (
      <div className="upload-skill-modal-state" aria-live="polite">
        <span className="upload-skill-modal-state-label">loading</span>
        <span className="upload-skill-modal-state-hint">fetching skill.md…</span>
      </div>
    );
  }, [skill]);

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
          <button
            type="button"
            className={`upload-action upload-action--primary${copied ? " is-copied" : ""}`}
            onClick={copyPrompt}
            data-copied={copied ? "true" : "false"}
            aria-label="Copy agent prompt"
          >
            <span className="upload-action__glow" aria-hidden="true" />
            <span className="upload-action__ripple" aria-hidden="true" />
            <span className="upload-action__icon" aria-hidden="true">
              <Copy className="upload-action__icon-idle" size={14} />
              <Check className="upload-action__icon-done" size={14} />
            </span>
            <span className="upload-action__label">
              <span className="upload-action__label-idle">Copy agent prompt</span>
              <span className="upload-action__label-done">Copied — paste into your agent</span>
            </span>
          </button>
          <button
            type="button"
            className="upload-action upload-action--ghost"
            onClick={openSkill}
            aria-label="View skill.md"
          >
            <span className="upload-action__icon" aria-hidden="true">
              <FileText size={14} />
            </span>
            <span className="upload-action__label">View skill.md</span>
            <span className="upload-action__trail" aria-hidden="true">
              <ArrowUpRight size={12} />
            </span>
          </button>
        </div>
      </article>

      <Modal state={modalState}>
        <ModalBackdrop className="upload-skill-modal-backdrop">
          <ModalContainer className="upload-skill-modal-container" placement="center">
            <ModalDialog className="upload-skill-modal-dialog">
              <ModalHeader className="upload-skill-modal-head">
                <div className="upload-skill-modal-head-text">
                  <span className="upload-skill-modal-eyebrow">
                    <span className="upload-skill-modal-eyebrow-dot" aria-hidden="true" />
                    skill · /upload
                  </span>
                  <ModalHeading className="upload-skill-modal-heading">skill.md</ModalHeading>
                  <span className="upload-skill-modal-path" aria-hidden="true">
                    {showcaseUploadSkillPath}
                  </span>
                </div>
                <ModalCloseTrigger className="upload-skill-modal-close" />
              </ModalHeader>
              <ModalBody className="upload-skill-modal-body">{skillBody}</ModalBody>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </div>
  );
}
