import { Input, Modal, Switch } from "@heroui/react";
import { useState } from "react";

import { BlurFade } from "@/shared/ui/motion";
import type { UserProfile } from "./RailUserMenu";

type AccountSettingsModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
};

export function AccountSettingsModal({ isOpen, onOpenChange, profile }: AccountSettingsModalProps) {
  const [displayName, setDisplayName] = useState(profile.name);
  const [username, setUsername] = useState(profile.name);
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarMode, setAvatarMode] = useState<"image" | "default">("image");

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop className="account-settings-backdrop">
        <Modal.Container className="account-settings-container" placement="center">
          <Modal.Dialog className="account-settings-dialog" aria-label="Account settings">
            <Modal.Header className="account-settings-header">
              <Modal.Heading className="account-settings-heading">Account settings</Modal.Heading>
              <Modal.CloseTrigger aria-label="Close account settings" />
            </Modal.Header>

            <Modal.Body className="account-settings-body">
              <BlurFade delay={0.15} duration={0.4} offsetY={4} blur={3}>
                <section className="account-settings-preview" aria-label="Profile picture preview">
                  <AvatarPreview mode={avatarMode} />
                  <div className="account-settings-preview-actions">
                    <button
                      className="account-settings-pill"
                      type="button"
                      onClick={() => setAvatarMode("image")}
                    >
                      Edit picture
                    </button>
                    <button
                      className={`account-settings-pill${avatarMode === "image" ? " is-active" : ""}`}
                      type="button"
                      onClick={() => setAvatarMode("image")}
                    >
                      Use image
                    </button>
                    <button
                      className={`account-settings-pill${
                        avatarMode === "default" ? " is-active" : ""
                      }`}
                      type="button"
                      onClick={() => setAvatarMode("default")}
                    >
                      Use default
                    </button>
                  </div>
                </section>
              </BlurFade>

              <BlurFade delay={0.24} duration={0.4} offsetY={4} blur={3}>
                <section className="account-settings-fields">
                  <FieldRow label="Display name">
                    <Input
                      className="account-settings-input"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      aria-label="Display name"
                    />
                  </FieldRow>

                  <FieldRow label="Username">
                    <Input
                      className="account-settings-input"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      aria-label="Username"
                    />
                  </FieldRow>

                  <FieldRow label="Email">
                    <span className="account-settings-value">{profile.email}</span>
                  </FieldRow>

                  <BlurFade delay={0.33} duration={0.4} offsetY={4} blur={3}>
                    <div className="account-settings-toggle">
                      <div className="account-settings-toggle-text">
                        <div className="account-settings-toggle-title">
                          <span>Keep designs private</span>
                          <span className="account-settings-tag-pro">Pro</span>
                        </div>
                        <p className="account-settings-toggle-hint">
                          Your designs will not be visible in search or on the Community page.
                        </p>
                      </div>
                      <Switch
                        className="account-settings-switch"
                        isSelected={isPrivate}
                        onChange={setIsPrivate}
                        aria-label="Toggle keep designs private"
                      >
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch>
                    </div>
                  </BlurFade>
                </section>
              </BlurFade>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

type FieldRowProps = {
  label: string;
  children: React.ReactNode;
};

function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className="account-settings-field">
      <span className="account-settings-field-label">{label}</span>
      {children}
    </div>
  );
}

function AvatarPreview({ mode }: { mode: "image" | "default" }) {
  return (
    <div className="account-settings-avatar" data-mode={mode} aria-hidden="true">
      {mode === "image" ? <PixelFigure /> : <DefaultGlyph />}
    </div>
  );
}

function PixelFigure() {
  return (
    <svg
      className="account-settings-avatar-art"
      viewBox="0 0 24 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      {PIXELS.map(([x, y, tone], index) => (
        <rect
          key={`${x}-${y}-${index}`}
          x={x}
          y={y}
          width={1}
          height={1}
          className={`account-settings-avatar-pixel account-settings-avatar-pixel--${tone}`}
        />
      ))}
    </svg>
  );
}

function DefaultGlyph() {
  return (
    <svg className="account-settings-avatar-art" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="9" r="4" className="account-settings-avatar-default" />
      <path
        d="M4 20c1.8-3.8 4.8-5.6 8-5.6s6.2 1.8 8 5.6"
        className="account-settings-avatar-default"
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type PixelTone = "deep" | "body" | "glow";
const PIXELS: ReadonlyArray<readonly [number, number, PixelTone]> = [
  // head
  [9, 1, "glow"],
  [10, 1, "body"],
  [11, 1, "body"],
  [12, 1, "body"],
  [13, 1, "glow"],
  [8, 2, "body"],
  [9, 2, "body"],
  [10, 2, "deep"],
  [11, 2, "body"],
  [12, 2, "body"],
  [13, 2, "body"],
  [14, 2, "body"],
  [8, 3, "body"],
  [9, 3, "body"],
  [10, 3, "body"],
  [11, 3, "glow"],
  [12, 3, "body"],
  [13, 3, "body"],
  [14, 3, "body"],
  [8, 4, "deep"],
  [9, 4, "body"],
  [10, 4, "body"],
  [11, 4, "body"],
  [12, 4, "body"],
  [13, 4, "body"],
  [14, 4, "deep"],
  // neck
  [10, 5, "body"],
  [11, 5, "glow"],
  [12, 5, "body"],
  // torso
  [7, 6, "body"],
  [8, 6, "body"],
  [9, 6, "body"],
  [10, 6, "body"],
  [11, 6, "body"],
  [12, 6, "body"],
  [13, 6, "body"],
  [14, 6, "body"],
  [15, 6, "body"],
  [6, 7, "deep"],
  [7, 7, "body"],
  [8, 7, "body"],
  [9, 7, "glow"],
  [10, 7, "body"],
  [11, 7, "body"],
  [12, 7, "body"],
  [13, 7, "glow"],
  [14, 7, "body"],
  [15, 7, "body"],
  [16, 7, "deep"],
  [6, 8, "body"],
  [7, 8, "body"],
  [8, 8, "body"],
  [9, 8, "body"],
  [10, 8, "body"],
  [11, 8, "body"],
  [12, 8, "body"],
  [13, 8, "body"],
  [14, 8, "body"],
  [15, 8, "body"],
  [16, 8, "body"],
  [6, 9, "body"],
  [7, 9, "glow"],
  [8, 9, "body"],
  [9, 9, "body"],
  [10, 9, "body"],
  [11, 9, "body"],
  [12, 9, "body"],
  [13, 9, "body"],
  [14, 9, "body"],
  [15, 9, "glow"],
  [16, 9, "body"],
  [6, 10, "body"],
  [7, 10, "body"],
  [8, 10, "body"],
  [9, 10, "body"],
  [10, 10, "deep"],
  [11, 10, "body"],
  [12, 10, "body"],
  [13, 10, "deep"],
  [14, 10, "body"],
  [15, 10, "body"],
  [16, 10, "body"],
  [6, 11, "body"],
  [7, 11, "body"],
  [8, 11, "body"],
  [9, 11, "body"],
  [10, 11, "body"],
  [11, 11, "body"],
  [12, 11, "body"],
  [13, 11, "body"],
  [14, 11, "body"],
  [15, 11, "body"],
  [16, 11, "body"],
  [7, 12, "body"],
  [8, 12, "body"],
  [9, 12, "body"],
  [10, 12, "body"],
  [11, 12, "glow"],
  [12, 12, "body"],
  [13, 12, "body"],
  [14, 12, "body"],
  [15, 12, "body"],
  // legs
  [8, 13, "body"],
  [9, 13, "body"],
  [10, 13, "body"],
  [13, 13, "body"],
  [14, 13, "body"],
  [15, 13, "body"],
  [8, 14, "deep"],
  [9, 14, "body"],
  [10, 14, "body"],
  [13, 14, "body"],
  [14, 14, "body"],
  [15, 14, "deep"],
  [8, 15, "body"],
  [9, 15, "body"],
  [10, 15, "body"],
  [13, 15, "body"],
  [14, 15, "body"],
  [15, 15, "body"],
  [8, 16, "body"],
  [9, 16, "body"],
  [10, 16, "deep"],
  [13, 16, "deep"],
  [14, 16, "body"],
  [15, 16, "body"],
  [8, 17, "body"],
  [9, 17, "body"],
  [14, 17, "body"],
  [15, 17, "body"],
  [8, 18, "deep"],
  [9, 18, "body"],
  [14, 18, "body"],
  [15, 18, "deep"],
  [7, 19, "body"],
  [8, 19, "body"],
  [9, 19, "body"],
  [14, 19, "body"],
  [15, 19, "body"],
  [16, 19, "body"],
];
