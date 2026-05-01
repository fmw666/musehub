import { Button, Chip, SearchField } from "@heroui/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { FormEvent } from "react";

import { Counter } from "@/shared/ui/motion";

type GalleryDiscoveryControlsProps = {
  filteredCount: number;
  totalCount: number;
  query: string;
  selectedTags: readonly string[];
  visibleTags: readonly string[];
  isTagListExpanded: boolean;
  hiddenTagCount: number;
  hasFilters: boolean;
  onClearFilters: () => void;
  onQueryChange: (query: string) => void;
  onToggleTag: (tag: string) => void;
  onToggleTagList: () => void;
};

export function GalleryDiscoveryControls({
  filteredCount,
  totalCount,
  query,
  selectedTags,
  visibleTags,
  isTagListExpanded,
  hiddenTagCount,
  hasFilters,
  onClearFilters,
  onQueryChange,
  onToggleTag,
  onToggleTagList,
}: GalleryDiscoveryControlsProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form
      className="gallery-discovery"
      aria-label="Search community showcases"
      onSubmit={handleSubmit}
    >
      <div className="gallery-discovery-panel">
        <div className="gallery-discovery-summary">
          <span>
            <Counter
              value={filteredCount}
              aria-label={`${filteredCount} showcases`}
              startFromZero
            />{" "}
            of {totalCount} showcases
          </span>
          {selectedTags.length > 0 ? (
            <div className="gallery-selected-tags" aria-label="Selected tags">
              {selectedTags.map((tag) => (
                <Chip
                  className="gallery-selected-tag"
                  key={tag}
                  size="sm"
                  variant="flat"
                  onClose={() => onToggleTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>

        <div className="gallery-tag-drawer" data-expanded={isTagListExpanded}>
          <div className="gallery-tag-strip" aria-label="Available tags">
            {visibleTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);

              return (
                <Button
                  className="gallery-tag-filter"
                  aria-pressed={isSelected}
                  color={isSelected ? "primary" : "default"}
                  key={tag}
                  size="sm"
                  variant={isSelected ? "solid" : "flat"}
                  onPress={() => onToggleTag(tag)}
                >
                  {tag}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="gallery-search-row">
          <SearchField
            className="gallery-search-field"
            aria-label="Search by title or tag"
            value={query}
            onChange={onQueryChange}
          >
            <SearchField.Group className="gallery-search-input">
              <Search aria-hidden="true" size={16} />
              <SearchField.Input
                className="gallery-search-native"
                placeholder="Search by title or tag..."
              />
            </SearchField.Group>
          </SearchField>
          {hasFilters ? (
            <Button
              className="gallery-search-control"
              aria-label="Clear search filters"
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onClearFilters}
            >
              <X aria-hidden="true" size={15} />
            </Button>
          ) : null}
          <Button
            className="gallery-search-control gallery-tag-toggle"
            aria-expanded={isTagListExpanded}
            aria-label={isTagListExpanded ? "Collapse tag filters" : "Expand tag filters"}
            size="sm"
            startContent={<SlidersHorizontal aria-hidden="true" size={15} />}
            variant="flat"
            onPress={onToggleTagList}
          >
            {isTagListExpanded
              ? "Hide tags"
              : hiddenTagCount > 0
                ? `Tags +${hiddenTagCount}`
                : "Tags"}
          </Button>
        </div>
      </div>
    </form>
  );
}
