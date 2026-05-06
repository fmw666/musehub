import {
  Bookmark,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Heart,
  Link,
} from "lucide-react";
import { Button, Card, Chip, Dropdown } from "@heroui/react";
import { type CSSProperties, memo, useMemo, useState } from "react";

import { createShowcaseCopyPrompt } from "@/entities/showcase/model/copy-prompt";
import type {
  ShowcaseDownload,
  ShowcaseEnvironment,
  ShowcaseItem,
} from "@/entities/showcase/model/types";
import { Counter, PressPulse } from "@/shared/ui/motion";
import { WallArtwork } from "./WallArtwork";

type GalleryCardProps = {
  item: ShowcaseItem;
  priority: number;
};

type PreviewCardStyle = CSSProperties & {
  "--asset-preview-ratio"?: string;
  "--asset-preview-width"?: string;
};

const environmentDisplayLabel: Record<ShowcaseEnvironment, string> = {
  vanilla: "Vanilla HTML",
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
  solid: "SolidJS",
  angular: "Angular",
};

function resolveDownloads(item: ShowcaseItem): readonly ShowcaseDownload[] {
  if (item.downloads && item.downloads.length > 0) {
    return item.downloads;
  }

  if (item.zipPath) {
    const fallbackKind: ShowcaseEnvironment = item.environment ?? "vanilla";
    return [
      {
        kind: fallbackKind,
        label: "Download code ZIP",
        url: item.zipPath,
      },
    ];
  }

  return [];
}

function triggerZipDownload(itemId: string, download: ShowcaseDownload) {
  const link = document.createElement("a");
  link.href = download.url;
  link.download = `${itemId}-${download.kind}.zip`;
  link.rel = "noopener noreferrer";
  link.click();
}

function GalleryCardInner({ item, priority }: GalleryCardProps) {
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);
  const copyablePrompt = useMemo(
    () => createShowcaseCopyPrompt(item, window.location.origin),
    [item],
  );
  const downloads = useMemo(() => resolveDownloads(item), [item]);

  const openAsset = () => {
    if (!item.assetPath) {
      return;
    }

    window.open(item.assetPath, "_blank", "noopener,noreferrer");
  };

  const copyPrompt = () => {
    if (!copyablePrompt) {
      return;
    }

    void navigator.clipboard.writeText(copyablePrompt).then(() => {
      setHasCopiedPrompt(true);
      window.setTimeout(() => setHasCopiedPrompt(false), 1600);
    });
  };

  const downloadByKind = (kind: string) => {
    const match = downloads.find((download) => download.kind === kind);
    if (!match) {
      return;
    }
    triggerZipDownload(item.id, match);
  };

  const downloadFirst = () => {
    if (downloads.length === 0) {
      return;
    }
    triggerZipDownload(item.id, downloads[0]);
  };

  const openSourceLink = () => {
    if (!item.sourceUrl) {
      return;
    }

    window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
  };

  const tags = item.tags?.length ? item.tags : [item.kind, item.status];
  const environmentLabel = item.environment ? environmentDisplayLabel[item.environment] : undefined;
  const previewStyle: PreviewCardStyle | undefined = item.preview
    ? {
        "--asset-preview-ratio": `${item.preview.width} / ${item.preview.height}`,
        "--asset-preview-width": `${item.preview.displayWidth ?? item.preview.width}px`,
      }
    : undefined;
  const hasMultipleDownloads = downloads.length > 1;
  const hasSingleDownload = downloads.length === 1;

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
          {environmentLabel ? (
            <Chip
              aria-label={`Source environment: ${environmentLabel}`}
              className="asset-mask-chip asset-env-chip"
              data-env={item.environment}
              size="sm"
              variant="flat"
            >
              {environmentLabel}
            </Chip>
          ) : null}
          {tags.slice(0, 4).map((tag) => (
            <Chip className="asset-mask-chip" key={tag} size="sm" variant="flat">
              {tag}
            </Chip>
          ))}
        </div>

        <div className="asset-social" aria-label={`${item.title} saves and likes`}>
          <span>
            <Bookmark aria-hidden="true" size={14} />
            {typeof item.favorites === "number" ? (
              <Counter value={item.favorites} aria-label={`${item.favorites} saves`} />
            ) : (
              "Save"
            )}
          </span>
          <span>
            <Heart aria-hidden="true" size={14} />
            {typeof item.likes === "number" ? (
              <Counter value={item.likes} aria-label={`${item.likes} likes`} />
            ) : (
              "Like"
            )}
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
            Open in new window
          </Button>
          <PressPulse triggerKey={hasCopiedPrompt} overlayClassName="gallery-prompt-pulse">
            <Button
              className="asset-mask-control"
              isDisabled={!copyablePrompt}
              size="sm"
              startContent={
                hasCopiedPrompt ? (
                  <Check aria-hidden="true" size={14} />
                ) : (
                  <Copy aria-hidden="true" size={14} />
                )
              }
              variant="flat"
              onPress={copyPrompt}
            >
              {hasCopiedPrompt ? "Prompt copied" : "Copy prompt"}
            </Button>
          </PressPulse>
          {hasMultipleDownloads ? (
            <Dropdown>
              <Dropdown.Trigger
                aria-label={`${item.title} download options`}
                className="asset-mask-control asset-mask-dropdown"
              >
                <span className="asset-mask-dropdown-content">
                  <Download aria-hidden="true" size={14} />
                  <span className="asset-mask-dropdown-label">Download code ZIP</span>
                  <ChevronDown aria-hidden="true" size={12} />
                </span>
              </Dropdown.Trigger>
              <Dropdown.Popover className="gallery-download-popover">
                <Dropdown.Menu
                  aria-label={`${item.title} download formats`}
                  onAction={(key) => downloadByKind(String(key))}
                >
                  {downloads.map((download) => (
                    <Dropdown.Item
                      id={download.kind}
                      key={download.kind}
                      textValue={download.label}
                    >
                      <span className="gallery-download-item">
                        <span className="gallery-download-item-label">{download.label}</span>
                        {download.description ? (
                          <span className="gallery-download-item-description">
                            {download.description}
                          </span>
                        ) : null}
                      </span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : (
            <Button
              className="asset-mask-control"
              isDisabled={!hasSingleDownload}
              size="sm"
              startContent={<Download aria-hidden="true" size={14} />}
              variant="flat"
              onPress={downloadFirst}
            >
              Download code ZIP
            </Button>
          )}
          {item.sourceUrl ? (
            <Button
              className="asset-mask-control"
              size="sm"
              startContent={<Link aria-hidden="true" size={14} />}
              variant="flat"
              onPress={openSourceLink}
            >
              View source project
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/*
 * Memoized so GalleryWall's filter/search state updates don't re-render
 * every card. Props are an immutable `item` (stable showcase object from
 * the items array, reference-equal across filter changes when the card
 * is still in the filtered view) plus a primitive `priority` number — the
 * default shallow-equality check is sufficient.
 */
export const GalleryCard = memo(GalleryCardInner);
