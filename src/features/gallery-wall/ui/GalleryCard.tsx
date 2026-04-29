import { Bookmark, Copy, Download, ExternalLink, Heart, Link } from "lucide-react";
import { Button, Card, Chip } from "@heroui/react";
import type { CSSProperties } from "react";

import type { ShowcaseItem } from "@/entities/showcase/model/types";
import { WallArtwork } from "./WallArtwork";

type GalleryCardProps = {
  item: ShowcaseItem;
  priority: number;
};

type PreviewCardStyle = CSSProperties & {
  "--asset-preview-ratio"?: string;
  "--asset-preview-width"?: string;
};

export function GalleryCard({ item, priority }: GalleryCardProps) {
  const openAsset = () => {
    if (!item.assetPath) {
      return;
    }

    window.open(item.assetPath, "_blank", "noopener,noreferrer");
  };

  const copyPrompt = () => {
    if (!item.prompt) {
      return;
    }

    void navigator.clipboard.writeText(item.prompt);
  };

  const downloadZip = () => {
    if (!item.zipPath) {
      return;
    }

    const link = document.createElement("a");
    link.href = item.zipPath;
    link.download = `${item.id}.zip`;
    link.rel = "noopener noreferrer";
    link.click();
  };

  const openSourceLink = () => {
    const href = item.linkUrl ?? item.sourceUrl ?? item.assetPath;

    if (!href) {
      return;
    }

    window.open(href, "_blank", "noopener,noreferrer");
  };

  const tags = item.tags?.length ? item.tags : [item.kind, item.status];
  const previewStyle: PreviewCardStyle | undefined = item.preview
    ? {
        "--asset-preview-ratio": `${item.preview.width} / ${item.preview.height}`,
        "--asset-preview-width": `${item.preview.width}px`,
      }
    : undefined;

  return (
    <Card
      className={`gallery-card gallery-card-${item.span}`}
      data-priority={priority}
      style={previewStyle}
    >
      <Card.Content className="gallery-card-content">
        <WallArtwork item={item} />
      </Card.Content>

      <div className="asset-hover-mask" aria-label={`${item.title} asset actions`}>
        <div className="asset-tags" aria-label={`${item.title} tags`}>
          {tags.slice(0, 4).map((tag) => (
            <Chip className="asset-mask-chip" key={tag} size="sm" variant="flat">
              {tag}
            </Chip>
          ))}
        </div>

        <div className="asset-social" aria-label={`${item.title} saves and likes`}>
          <span>
            <Bookmark aria-hidden="true" size={14} />
            {item.favorites ?? "Save"}
          </span>
          <span>
            <Heart aria-hidden="true" size={14} />
            {item.likes ?? "Like"}
          </span>
        </div>

        <div className="asset-caption">
          <Card.Title>{item.title}</Card.Title>
          <p>{item.source}</p>
        </div>

        <div className="asset-actions">
          <Button
            className="asset-mask-control"
            isDisabled={!item.assetPath}
            size="sm"
            startContent={<ExternalLink aria-hidden="true" size={14} />}
            variant="flat"
            onPress={openAsset}
          >
            New page
          </Button>
          <Button
            className="asset-mask-control"
            isDisabled={!item.prompt}
            size="sm"
            startContent={<Copy aria-hidden="true" size={14} />}
            variant="flat"
            onPress={copyPrompt}
          >
            Copy prompt
          </Button>
          <Button
            className="asset-mask-control"
            isDisabled={!item.zipPath}
            size="sm"
            startContent={<Download aria-hidden="true" size={14} />}
            variant="flat"
            onPress={downloadZip}
          >
            Download zip
          </Button>
          <Button
            className="asset-mask-control"
            isDisabled={!item.linkUrl && !item.sourceUrl && !item.assetPath}
            size="sm"
            startContent={<Link aria-hidden="true" size={14} />}
            variant="flat"
            onPress={openSourceLink}
          >
            Open link
          </Button>
        </div>
      </div>
    </Card>
  );
}
