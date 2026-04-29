import { Button } from "@heroui/react";

import { primaryNavigation, type PrimaryNavigationItem } from "@/app/navigation/primary-navigation";
import { BrandMark } from "@/shared/ui/BrandMark";
import { type RailGlyphName, RailGlyph } from "@/shared/ui/RailGlyph";

type CenterRailId = Exclude<PrimaryNavigationItem["id"], "home">;
type CenterRailItem = Extract<PrimaryNavigationItem, { id: CenterRailId }>;

const railIconById = {
  community: "compass",
  upload: "compose",
  favorites: "bookmark",
  repositories: "folder",
} satisfies Record<CenterRailId, RailGlyphName>;

type SideRailProps = {
  activePageId: PrimaryNavigationItem["id"];
  onNavigate: (item: PrimaryNavigationItem) => void;
  showPrimaryNavigation?: boolean;
};

export function SideRail({
  activePageId,
  onNavigate,
  showPrimaryNavigation = true,
}: SideRailProps) {
  const centerItems = primaryNavigation.filter(
    (item): item is CenterRailItem => item.id !== "home",
  );
  const homeItem = primaryNavigation.find((item) => item.id === "home");

  return (
    <nav className="side-rail" aria-label="MuseHub navigation">
      <Button
        className={`rail-brand${activePageId === "home" ? " is-active" : ""}`}
        variant="light"
        aria-label="MuseHub home"
        aria-current={activePageId === "home" ? "page" : undefined}
        onPress={() => {
          if (homeItem) {
            onNavigate(homeItem);
          }
        }}
      >
        <BrandMark />
      </Button>

      {showPrimaryNavigation ? (
        <div className="rail-icon-group" aria-label="Primary sections">
          {centerItems.map((item) => (
            <Button
              className={`rail-icon${item.id === activePageId ? " is-active" : ""}`}
              isIconOnly
              key={item.id}
              type="button"
              variant="light"
              aria-label={item.label}
              aria-current={item.id === activePageId ? "page" : undefined}
              onPress={() => {
                onNavigate(item);
              }}
            >
              <RailGlyph name={railIconById[item.id]} />
            </Button>
          ))}
        </div>
      ) : null}

      <Button
        className="rail-user"
        isIconOnly
        type="button"
        variant="light"
        aria-label="Guest profile"
      >
        <svg className="rail-avatar" viewBox="0 0 24 24" aria-hidden="true">
          <path
            className="rail-avatar-kite"
            d="M15.8 3.8 20 8.4l-7.5 3.2-3.2 7.5-4.6-4.2 4.5-6.6 6.6-4.5Z"
          />
          <path className="rail-avatar-spine" d="M20 8.4 9.3 19.1" />
          <path className="rail-avatar-tail" d="M9.3 19.1c-1.6-.1-2.5.4-3 1.5" />
          <circle className="rail-avatar-node" cx="20" cy="8.4" r="1.35" />
        </svg>
      </Button>
    </nav>
  );
}
