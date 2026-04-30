import { ScrollShadow } from "@heroui/react";
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import type { ShowcaseItem } from "@/entities/showcase/model/types";
import {
  filterShowcaseItems,
  getTagOptions,
  normalizeSearchTerm,
} from "../model/gallery-filtering";
import { GalleryDiscoveryControls } from "./GalleryDiscoveryControls";
import { GalleryEmptyState } from "./GalleryEmptyState";
import { GalleryCard } from "./GalleryCard";
import "./GalleryWall.css";

type GalleryWallProps = {
  items: readonly ShowcaseItem[];
};

type ViewTransition = {
  finished: Promise<void>;
};

type StartViewTransition = (updateCallback: () => void) => ViewTransition;

const collapsedTagLimit = 6;

export function GalleryWall({ items }: GalleryWallProps) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const [isTagListExpanded, setIsTagListExpanded] = useState(false);
  const isResultTransitioningRef = useRef(false);

  const tagOptions = useMemo(() => getTagOptions(items), [items]);
  const visibleTags = isTagListExpanded ? tagOptions : tagOptions.slice(0, collapsedTagLimit);
  const normalizedQuery = normalizeSearchTerm(query);
  const filteredItems = useMemo(
    () => filterShowcaseItems(items, query, selectedTags),
    [items, query, selectedTags],
  );

  const updateResults = (update: () => void) => {
    const startViewTransition = getStartViewTransition();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!startViewTransition || prefersReducedMotion || isResultTransitioningRef.current) {
      update();
      return;
    }

    isResultTransitioningRef.current = true;
    const transition = startViewTransition(() => {
      flushSync(update);
    });

    void transition.finished.finally(() => {
      isResultTransitioningRef.current = false;
    });
  };

  const toggleTag = (tag: string) => {
    updateResults(() =>
      setSelectedTags((currentTags) =>
        currentTags.includes(tag)
          ? currentTags.filter((currentTag) => currentTag !== tag)
          : [...currentTags, tag],
      ),
    );
  };

  const clearFilters = () => {
    updateResults(() => {
      setQuery("");
      setSelectedTags([]);
    });
  };

  const selectSuggestedTag = (tag: string) => {
    updateResults(() => {
      setQuery("");
      setSelectedTags([tag]);
    });
  };

  const updateQuery = (nextQuery: string) => {
    updateResults(() => setQuery(nextQuery));
  };

  const hasFilters = normalizedQuery.length > 0 || selectedTags.length > 0;
  const hiddenTagCount = Math.max(tagOptions.length - visibleTags.length, 0);
  const suggestedTags = tagOptions
    .filter((tag) => !selectedTags.includes(tag))
    .slice(0, collapsedTagLimit);
  const hasResults = filteredItems.length > 0;

  return (
    <>
      <ScrollShadow
        className="gallery-wall"
        data-count={filteredItems.length}
        data-search-state={hasFilters ? "filtered" : "all"}
      >
        <div className="gallery-results-stage" data-result-state={hasResults ? "results" : "empty"}>
          {hasResults ? (
            <GalleryResultsGrid items={filteredItems} />
          ) : (
            <GalleryEmptyState
              hasFilters={hasFilters}
              query={query}
              selectedTags={selectedTags}
              suggestedTags={suggestedTags}
              onReset={clearFilters}
              onSelectSuggestion={selectSuggestedTag}
            />
          )}
        </div>
      </ScrollShadow>

      <GalleryDiscoveryControls
        filteredCount={filteredItems.length}
        hasFilters={hasFilters}
        hiddenTagCount={hiddenTagCount}
        isTagListExpanded={isTagListExpanded}
        query={query}
        selectedTags={selectedTags}
        totalCount={items.length}
        visibleTags={visibleTags}
        onClearFilters={clearFilters}
        onQueryChange={updateQuery}
        onToggleTag={toggleTag}
        onToggleTagList={() => setIsTagListExpanded((current) => !current)}
      />
    </>
  );
}

function GalleryResultsGrid({ items }: { items: readonly ShowcaseItem[] }) {
  return (
    <div className="gallery-results-grid" data-count={items.length}>
      {items.map((item, index) => (
        <GalleryCard item={item} key={item.id} priority={index + 1} />
      ))}
    </div>
  );
}

function getStartViewTransition(): StartViewTransition | undefined {
  return (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
}
