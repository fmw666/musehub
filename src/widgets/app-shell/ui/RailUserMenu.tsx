import { Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { type ReactNode, type SVGProps, useState } from "react";

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
                  icon={<SettingsGlyph aria-hidden="true" />}
                  label="Account Settings"
                  onSelect={handleOpenSettings}
                />
              </li>
              <li role="none">
                <MenuItem icon={<MessageSquareGlyph aria-hidden="true" />} label="Give feedback" />
              </li>
              <li role="none">
                <MenuItem icon={<FileTextGlyph aria-hidden="true" />} label="Terms and Privacy" />
              </li>
            </ul>

            <div className="rail-user-menu-divider" role="separator" />

            <ul className="rail-user-menu-list" role="menu">
              <li role="none">
                <MenuItem icon={<LogOutGlyph aria-hidden="true" />} label="Log out" tone="muted" />
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

/*
 * "Atelier Medallion" — pure linework, matching the four navigation
 * glyphs (shell + one calligraphic stroke, no fills, no dots):
 *
 *   - Shell:  a clean circular medallion that echoes the compass disc
 *             at the other end of the rail, closing the icon family
 *             into a loop.
 *   - Stroke: one continuous "horizon + hill" curve inscribed across
 *             the medallion. That curve lights up to honey on hover
 *             / active.
 *
 * Intentionally NOT a head-and-shoulders user pictogram. A circular
 * inscribed medallion reads as "your account / your corner" while
 * staying in the Atelier Ink linework language.
 */
function UserAvatarGlyph() {
  return (
    <svg className="rail-glyph rail-avatar" viewBox="0 0 24 24" aria-hidden="true">
      <g className="rail-glyph-mark">
        <circle className="rail-glyph-shell" cx="12" cy="12" r="8.2" />
        <path className="rail-glyph-stroke" d="M5.4 13.4c2.4-3 4.6-3 6.6-1s4.2 2 6.6-1" />
      </g>
    </svg>
  );
}

function clampPercent(left: number, total: number) {
  if (total <= 0) return 0;
  const pct = (left / total) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/*
 * Inlined Lucide v1.14.0 icon data (ISC license) so the rail user menu —
 * which sits on every route — doesn't pull the full Lucide icon runtime
 * into the main bundle. Path + attribute defaults match lucide-react's
 * createLucideIcon output so there is no visual change.
 */
const glyphDefaults: SVGProps<SVGSVGElement> = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  width: 15,
  height: 15,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function SettingsGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyphDefaults} {...props}>
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MessageSquareGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyphDefaults} {...props}>
      <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileTextGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyphDefaults} {...props}>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function LogOutGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyphDefaults} {...props}>
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  );
}
