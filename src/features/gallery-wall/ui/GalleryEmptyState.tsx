import { Button, Chip } from "@heroui/react";
import { RotateCcw, Sparkles } from "lucide-react";

import { BlurFade } from "@/shared/ui/motion";

type GalleryEmptyStateProps = {
  query: string;
  selectedTags: readonly string[];
  suggestedTags: readonly string[];
  hasFilters: boolean;
  onReset: () => void;
  onSelectSuggestion: (tag: string) => void;
};

export function GalleryEmptyState({
  query,
  selectedTags,
  suggestedTags,
  hasFilters,
  onReset,
  onSelectSuggestion,
}: GalleryEmptyStateProps) {
  const trimmedQuery = query.trim();

  return (
    <div className="gallery-empty-state" role="status">
      <div className="gallery-empty-orbit" aria-hidden="true">
        <Sparkles size={18} />
      </div>
      <BlurFade delay={0.08}>
        <div className="gallery-empty-copy">
          <Chip className="stage-chip gallery-empty-chip" variant="bordered">
            No matches
          </Chip>
          <h2>No showcase found for this search</h2>
          <p>
            Try a broader title search, remove a tag, or jump to one of the live community labels
            below.
          </p>
        </div>
      </BlurFade>
      {hasFilters ? (
        <div className="gallery-empty-query" aria-label="Active empty search filters">
          {trimmedQuery.length > 0 ? <span>Search: {trimmedQuery}</span> : null}
          {selectedTags.map((tag) => (
            <span key={tag}>Tag: {tag}</span>
          ))}
        </div>
      ) : null}
      {suggestedTags.length > 0 ? (
        <div className="gallery-empty-suggestions" aria-label="Suggested tags">
          {suggestedTags.map((tag) => (
            <Button
              className="gallery-empty-suggestion"
              key={tag}
              size="sm"
              variant="flat"
              onPress={() => onSelectSuggestion(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      ) : null}
      <Button
        className="gallery-empty-reset"
        size="sm"
        startContent={<RotateCcw aria-hidden="true" size={14} />}
        variant="flat"
        onPress={onReset}
      >
        Reset discovery
      </Button>
    </div>
  );
}
