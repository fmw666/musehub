import { Button, Chip, ScrollShadow, SearchField } from "@heroui/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import type { ShowcaseItem } from "@/entities/showcase/model/types";
import { GalleryCard } from "./GalleryCard";

type GalleryWallProps = {
  items: readonly ShowcaseItem[];
};

const collapsedTagLimit = 6;

export function GalleryWall({ items }: GalleryWallProps) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const [isTagListExpanded, setIsTagListExpanded] = useState(false);

  const tagOptions = useMemo(() => getTagOptions(items), [items]);
  const visibleTags = isTagListExpanded ? tagOptions : tagOptions.slice(0, collapsedTagLimit);
  const normalizedQuery = normalizeSearchTerm(query);
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const itemTags = getItemTags(item);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          normalizeSearchTerm(item.title).includes(normalizedQuery) ||
          itemTags.some((tag) => normalizeSearchTerm(tag).includes(normalizedQuery));
        const matchesSelectedTags =
          selectedTags.length === 0 || selectedTags.every((tag) => itemTags.includes(tag));

        return matchesQuery && matchesSelectedTags;
      }),
    [items, normalizedQuery, selectedTags],
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag],
    );
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedTags([]);
  };

  const hasFilters = normalizedQuery.length > 0 || selectedTags.length > 0;
  const hiddenTagCount = Math.max(tagOptions.length - visibleTags.length, 0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <>
      <ScrollShadow className="gallery-wall" data-count={filteredItems.length} hideScrollBar>
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <GalleryCard item={item} key={item.id} priority={index + 1} />
          ))
        ) : (
          <div className="gallery-empty-state" role="status">
            <Chip className="stage-chip" variant="bordered">
              No matches
            </Chip>
            <p>Try another title or tag to rediscover the community wall.</p>
          </div>
        )}
      </ScrollShadow>

      <form
        className="gallery-discovery"
        aria-label="Search community showcases"
        onSubmit={handleSubmit}
      >
        <div className="gallery-discovery-panel">
          <div className="gallery-discovery-summary">
            <span>
              {filteredItems.length} of {items.length} showcases
            </span>
            {selectedTags.length > 0 ? (
              <div className="gallery-selected-tags" aria-label="Selected tags">
                {selectedTags.map((tag) => (
                  <Chip
                    className="gallery-selected-tag"
                    key={tag}
                    size="sm"
                    variant="flat"
                    onClose={() => toggleTag(tag)}
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
                    onPress={() => toggleTag(tag)}
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
              onChange={setQuery}
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
                onPress={clearFilters}
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
              onPress={() => setIsTagListExpanded((current) => !current)}
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
    </>
  );
}

function getTagOptions(items: readonly ShowcaseItem[]) {
  return Array.from(new Set(items.flatMap((item) => getItemTags(item)))).sort((first, second) =>
    first.localeCompare(second),
  );
}

function getItemTags(item: ShowcaseItem) {
  return Array.from(new Set([...(item.tags ?? []), item.kind, item.status].filter(Boolean)));
}

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase();
}
