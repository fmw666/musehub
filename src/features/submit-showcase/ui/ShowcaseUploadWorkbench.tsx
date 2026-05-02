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

// Skeleton line widths (in % of body width). Tuned to look like a fragment of
// markdown — title, paragraph wrap, a code block, more paragraph — without
// pretending to be the real content. Stable so we don't repaint on every
// render. We render a fixed shape (~12 lines) which fills the modal body
// height comfortably; the real skill.md is ~115 lines so the skeleton reads
// as "this is the top of the file" rather than "the whole thing".
const SKILL_SKELETON_LINES: readonly number[] = [62, 92, 84, 0, 38, 96, 88, 100, 72, 0, 56, 80];

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

  // Crossfade stage: the modal body always renders the skeleton + code +
  // error layers stacked, and toggles which layer is "active" via a single
  // data attribute. CSS handles the opacity / clip-path transitions, so we
  // don't introduce any extra motion.div instances and the work the GPU does
  // on swap is one composite per layer. The skeleton stays mounted so its
  // shimmer keeps running smoothly until the moment the code curtains in.
  const stage = skill.status === "ready" ? "ready" : skill.status === "error" ? "error" : "loading";

  const skillBody = useMemo(() => {
    return (
      <div className="upload-skill-modal-stage" data-stage={stage} aria-live="polite">
        <div
          className="upload-skill-modal-skeleton"
          aria-hidden={stage === "loading" ? undefined : true}
        >
          <span className="upload-skill-modal-skeleton-status">
            <span className="upload-skill-modal-skeleton-status-dot" aria-hidden="true" />
            <span>fetching skill.md…</span>
          </span>
          <div className="upload-skill-modal-skeleton-lines">
            {SKILL_SKELETON_LINES.map((width, index) =>
              width === 0 ? (
                <span
                  key={`gap-${index}`}
                  className="upload-skill-modal-skeleton-gap"
                  aria-hidden="true"
                />
              ) : (
                <span
                  key={`line-${index}`}
                  className="upload-skill-modal-skeleton-line"
                  style={{ width: `${width}%`, animationDelay: `${index * 90}ms` }}
                  aria-hidden="true"
                />
              ),
            )}
          </div>
        </div>

        {skill.status === "ready" ? (
          <pre
            className="upload-skill-modal-code"
            tabIndex={0}
            data-revealing={stage === "ready" ? "true" : "false"}
          >
            {skill.content}
            <span className="upload-skill-modal-code-curtain" aria-hidden="true" />
          </pre>
        ) : null}

        {skill.status === "error" ? (
          <div className="upload-skill-modal-state" role="alert">
            <span className="upload-skill-modal-state-label">failed</span>
            <span className="upload-skill-modal-state-hint">{skill.message}</span>
          </div>
        ) : null}
      </div>
    );
  }, [skill, stage]);

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
