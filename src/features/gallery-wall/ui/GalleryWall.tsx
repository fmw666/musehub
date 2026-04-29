import { ScrollShadow } from "@heroui/react";

import type { ShowcaseItem } from "@/entities/showcase/model/types";
import { GalleryCard } from "./GalleryCard";

type GalleryWallProps = {
  items: readonly ShowcaseItem[];
};

export function GalleryWall({ items }: GalleryWallProps) {
  return (
    <ScrollShadow className="gallery-wall" data-count={items.length} hideScrollBar>
      {items.map((item, index) => (
        <GalleryCard item={item} key={item.id} priority={index + 1} />
      ))}
    </ScrollShadow>
  );
}
