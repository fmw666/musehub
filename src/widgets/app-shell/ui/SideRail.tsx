import { Button } from "@heroui/react";
import { useLayoutEffect, useRef, useState } from "react";

import { primaryNavigation, type PrimaryNavigationItem } from "@/app/navigation/primary-navigation";
import { BrandMark } from "@/shared/ui/BrandMark";
import { type RailGlyphName, RailGlyph } from "@/shared/ui/RailGlyph";
import { type HighlightRect, MotionHighlight } from "@/shared/ui/motion";

import { RailUserMenu } from "./RailUserMenu";

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

  const groupRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const registerItemRef = (id: string) => (node: HTMLButtonElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  };

  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) {
      setHighlightRect(null);
      return;
    }
    const activeButton = itemRefs.current.get(activePageId);
    if (!activeButton) {
      setHighlightRect(null);
      return;
    }

    const measure = () => {
      const groupBox = group.getBoundingClientRect();
      const itemBox = activeButton.getBoundingClientRect();
      setHighlightRect({
        x: itemBox.left - groupBox.left,
        y: itemBox.top - groupBox.top,
        width: itemBox.width,
        height: itemBox.height,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(group);
    observer.observe(activeButton);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activePageId, showPrimaryNavigation]);

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
        <div className="rail-icon-group" aria-label="Primary sections" ref={groupRef}>
          <MotionHighlight className="rail-icon-highlight" rect={highlightRect} />
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
              ref={registerItemRef(item.id)}
            >
              <RailGlyph name={railIconById[item.id]} />
            </Button>
          ))}
        </div>
      ) : null}

      <RailUserMenu />
    </nav>
  );
}
