import { Button, Card, Chip, Tooltip } from "@heroui/react";

import type { ShowcaseItem } from "@/entities/showcase/model/types";
import { WallArtwork } from "./WallArtwork";

type GalleryCardProps = {
  item: ShowcaseItem;
  priority: number;
};

export function GalleryCard({ item, priority }: GalleryCardProps) {
  return (
    <Tooltip content={`${item.title} / ${item.source}`} delay={200}>
      <Card className={`gallery-card gallery-card-${item.span}`} data-priority={priority}>
        <Card.Header className="card-topline">
          <Chip className="meta-chip" variant="bordered">
            {item.kind}
          </Chip>
          <Chip className="meta-chip" variant="bordered">
            {item.status}
          </Chip>
        </Card.Header>

        <Card.Content className="gallery-card-content">
          <WallArtwork tone={item.tone} />
        </Card.Content>

        <Card.Footer className="card-caption">
          <div>
            <Card.Title>{item.title}</Card.Title>
            <p>{item.source}</p>
          </div>
          <Button className="open-pen-button" size="sm" variant="light">
            Open
          </Button>
        </Card.Footer>
      </Card>
    </Tooltip>
  );
}
