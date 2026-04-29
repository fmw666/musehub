import { Button } from "@heroui/react";

import { primaryNavigation } from "@/app/navigation/primary-navigation";
import { BrandMark } from "@/shared/ui/BrandMark";
import { RailGlyph } from "@/shared/ui/RailGlyph";

export function SideRail() {
  return (
    <nav className="side-rail" aria-label="MuseHub navigation">
      <Button className="rail-brand" variant="light" aria-label="MuseHub home">
        <BrandMark label="Community" />
      </Button>

      <div className="rail-spacer" />

      {primaryNavigation.map((item) => (
        <Button
          className={`rail-icon${item.id === "community" ? " is-active" : ""}`}
          isIconOnly
          key={item.id}
          type="button"
          variant="light"
          aria-label={item.label}
        >
          <RailGlyph name={item.icon} />
        </Button>
      ))}
    </nav>
  );
}
