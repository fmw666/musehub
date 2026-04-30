import { useCallback, useState } from "react";
import { Chip } from "@heroui/react";

import { ShowcaseUploadWorkbench } from "@/features/submit-showcase/ui/ShowcaseUploadWorkbench";
import { AgentMascot, type AgentName } from "@/shared/ui/agent-mascot";

type AgentCardDef = {
  name: AgentName;
  label: string;
  hint: string;
};

const AGENTS: readonly AgentCardDef[] = [
  { name: "cursor", label: "Cursor", hint: "@/upload/skill.md" },
  { name: "claude", label: "Claude Code", hint: "/read skill.md" },
  { name: "codex", label: "Codex", hint: "codex exec" },
  { name: "gemini", label: "Gemini CLI", hint: "gemini ingest" },
  { name: "copilot", label: "Copilot", hint: "@workspace /new" },
];

const CLICK_DURATION: Record<AgentName, number> = {
  claude: 4200,
  codex: 700,
  gemini: 700,
  cursor: 750,
  copilot: 1900,
};

export function UploadPage() {
  const [hovered, setHovered] = useState<AgentName | null>(null);
  const [clicked, setClicked] = useState<AgentName | null>(null);

  const handleSelect = useCallback((agent: AgentCardDef) => {
    setClicked(agent.name);
    window.setTimeout(() => {
      setClicked((current) => (current === agent.name ? null : current));
    }, CLICK_DURATION[agent.name]);
  }, []);

  return (
    <section className="upload-stage" aria-label="MuseHub upload workspace">
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
          这个页面不收集信息。把上面的 prompt 交给任意一个 agent —— agent 会读
          skill、来问你要素、然后提交 PR。
        </p>
      </header>

      <ShowcaseUploadWorkbench />

      <section className="upload-agent-picker" aria-label="Supported coding agents">
        <header className="upload-agent-picker-head">
          <span className="upload-agent-picker-kicker">pick your agent</span>
          <span className="upload-agent-picker-sub">hover to wake · click to poke</span>
        </header>
        <div className="hk-agent-card-row" aria-label="Detected agents">
          {AGENTS.map((agent) => {
            const isHovered = hovered === agent.name;
            const isClicked = clicked === agent.name;
            return (
              <button
                key={agent.name}
                type="button"
                className={`hk-agent-card hk-agent-card--${agent.name}${isClicked ? " is-clicked" : ""}`}
                onMouseEnter={() => setHovered(agent.name)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(agent.name)}
                onBlur={() => setHovered(null)}
                onClick={() => handleSelect(agent)}
                aria-label={agent.label}
              >
                <span className="hk-agent-card__icon" aria-hidden="true">
                  <AgentMascot
                    name={agent.name}
                    size={42}
                    animated={isHovered}
                    clicked={isClicked}
                  />
                </span>
                <span className="hk-agent-card__label">{agent.label}</span>
                <span className="hk-agent-card__count">{agent.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="upload-stage-footer" aria-hidden="true">
        <div className="upload-stage-footer-left">
          <span className="upload-stage-footer-label">runtime</span>
          <span className="upload-stage-footer-value">musehub://agent.upload.v1</span>
        </div>
        <div className="upload-stage-footer-right">
          <span className="upload-stage-footer-label">mode</span>
          <span className="upload-stage-footer-value">hand-off</span>
        </div>
      </footer>
    </section>
  );
}
