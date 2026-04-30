import type { ComponentType, CSSProperties } from "react";
import { ClaudeMascot } from "./ClaudeMascot";
import { CursorMascot } from "./CursorMascot";
import { CodexMascot } from "./CodexMascot";
import { GeminiMascot } from "./GeminiMascot";
import { CopilotMascot } from "./CopilotMascot";
import type { MascotProps } from "./ClaudeMascot";

export type AgentName = "claude" | "cursor" | "codex" | "gemini" | "copilot";

type MascotEntry = {
  component: ComponentType<MascotProps>;
  className: string;
  scale?: number;
  offsetY?: number;
  passClicked?: boolean;
};

const MASCOT_MAP: Record<AgentName, MascotEntry> = {
  claude: { component: ClaudeMascot, className: "mascot-claude", scale: 1 },
  cursor: { component: CursorMascot, className: "mascot-cursor", scale: 1.15 },
  codex: {
    component: CodexMascot,
    className: "mascot-codex",
    scale: 0.8,
    offsetY: -1,
  },
  gemini: { component: GeminiMascot, className: "mascot-gemini", scale: 1.2 },
  copilot: {
    component: CopilotMascot,
    className: "mascot-copilot",
    scale: 0.95,
    passClicked: true,
  },
};

type AgentMascotProps = {
  name: AgentName;
  size?: number;
  animated?: boolean;
  clicked?: boolean;
};

export function AgentMascot({
  name,
  size = 42,
  animated = false,
  clicked = false,
}: AgentMascotProps) {
  const entry = MASCOT_MAP[name];
  const Comp = entry.component;
  const renderSize = size * (entry.scale ?? 1);
  const classes = [entry.className, animated && "is-animated", clicked && "is-clicked"]
    .filter(Boolean)
    .join(" ");

  const innerStyle: CSSProperties = {
    flexShrink: 0,
    transform: entry.offsetY ? `translateY(${entry.offsetY}px)` : undefined,
  };

  return (
    <div
      className={classes}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
    >
      <div style={innerStyle}>
        <Comp size={renderSize} clicked={entry.passClicked ? clicked : undefined} />
      </div>
    </div>
  );
}
