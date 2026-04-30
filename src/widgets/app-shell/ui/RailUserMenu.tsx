import { Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { FileText, LogOut, MessageSquare, Settings } from "lucide-react";
import { type ReactNode, useState } from "react";

import { AccountSettingsModal } from "./AccountSettingsModal";

type RailUserMenuProps = {
  profile?: UserProfile;
};

export type UserProfile = {
  name: string;
  email: string;
  plan: string;
  usage: {
    fastLeft: number;
    qualityLeft: number;
    fastTotal: number;
    qualityTotal: number;
  };
};

const defaultProfile: UserProfile = {
  name: "fmw19990718",
  email: "fmw19990718@gmail.com",
  plan: "Free",
  usage: {
    fastLeft: 60,
    qualityLeft: 12,
    fastTotal: 150,
    qualityTotal: 50,
  },
};

export function RailUserMenu({ profile = defaultProfile }: RailUserMenuProps) {
  const fastPercent = clampPercent(profile.usage.fastLeft, profile.usage.fastTotal);
  const qualityPercent = clampPercent(profile.usage.qualityLeft, profile.usage.qualityTotal);
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const handleOpenSettings = () => {
    setPopoverOpen(false);
    setSettingsOpen(true);
  };

  return (
    <>
      <Popover isOpen={isPopoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger className="rail-user" aria-label={`${profile.name} profile menu`}>
          <UserAvatarGlyph />
        </PopoverTrigger>
        <PopoverContent
          className="rail-user-menu"
          placement="right bottom"
          offset={12}
          crossOffset={-8}
        >
          <div className="rail-user-menu-body">
            <header className="rail-user-menu-header">
              <span className="rail-user-menu-avatar" aria-hidden="true">
                <UserAvatarGlyph />
              </span>
              <div className="rail-user-menu-identity">
                <div className="rail-user-menu-topline">
                  <span className="rail-user-menu-name">{profile.name}</span>
                  <span className="rail-user-menu-plan">{profile.plan}</span>
                </div>
                <span className="rail-user-menu-email" title={profile.email}>
                  {profile.email}
                </span>
              </div>
            </header>

            <section className="rail-user-menu-usage" aria-label="Plan usage">
              <div className="rail-user-menu-usage-label">
                <span>
                  {profile.usage.fastLeft} Fast, {profile.usage.qualityLeft} Quality left
                </span>
              </div>
              <div className="rail-user-menu-usage-track" aria-hidden="true">
                <span className="rail-user-menu-usage-fill" style={{ width: `${fastPercent}%` }} />
                <span
                  className="rail-user-menu-usage-fill rail-user-menu-usage-fill--quality"
                  style={{ width: `${qualityPercent}%` }}
                />
              </div>
            </section>

            <ul className="rail-user-menu-list" role="menu">
              <li role="none">
                <MenuItem
                  icon={<Settings aria-hidden="true" />}
                  label="Account Settings"
                  onSelect={handleOpenSettings}
                />
              </li>
              <li role="none">
                <MenuItem icon={<MessageSquare aria-hidden="true" />} label="Give feedback" />
              </li>
              <li role="none">
                <MenuItem icon={<FileText aria-hidden="true" />} label="Terms and Privacy" />
              </li>
            </ul>

            <div className="rail-user-menu-divider" role="separator" />

            <ul className="rail-user-menu-list" role="menu">
              <li role="none">
                <MenuItem icon={<LogOut aria-hidden="true" />} label="Log out" tone="muted" />
              </li>
            </ul>
          </div>
        </PopoverContent>
      </Popover>
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={setSettingsOpen}
        profile={profile}
      />
    </>
  );
}

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  tone?: "default" | "muted";
  onSelect?: () => void;
};

function MenuItem({ icon, label, tone = "default", onSelect }: MenuItemProps) {
  return (
    <button
      className={`rail-user-menu-item${tone === "muted" ? " is-muted" : ""}`}
      type="button"
      role="menuitem"
      onClick={onSelect}
    >
      <span className="rail-user-menu-item-icon">{icon}</span>
      <span className="rail-user-menu-item-label">{label}</span>
    </button>
  );
}

function UserAvatarGlyph() {
  return (
    <svg className="rail-avatar" viewBox="0 0 24 24" aria-hidden="true">
      <path
        className="rail-avatar-kite"
        d="M15.8 3.8 20 8.4l-7.5 3.2-3.2 7.5-4.6-4.2 4.5-6.6 6.6-4.5Z"
      />
      <path className="rail-avatar-spine" d="M20 8.4 9.3 19.1" />
      <path className="rail-avatar-tail" d="M9.3 19.1c-1.6-.1-2.5.4-3 1.5" />
      <circle className="rail-avatar-node" cx="20" cy="8.4" r="1.35" />
    </svg>
  );
}

function clampPercent(left: number, total: number) {
  if (total <= 0) return 0;
  const pct = (left / total) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
