import type { ShowcaseItem } from "@/entities/showcase/model/types";

export function filterShowcaseItems(
  items: readonly ShowcaseItem[],
  query: string,
  selectedTags: readonly string[],
) {
  const normalizedQuery = normalizeSearchTerm(query);

  return items.filter((item) => {
    const itemTags = getItemTags(item);
    const matchesQuery =
      normalizedQuery.length === 0 ||
      normalizeSearchTerm(item.title).includes(normalizedQuery) ||
      itemTags.some((tag) => normalizeSearchTerm(tag).includes(normalizedQuery));
    const matchesSelectedTags =
      selectedTags.length === 0 || selectedTags.every((tag) => itemTags.includes(tag));

    return matchesQuery && matchesSelectedTags;
  });
}

export function getTagOptions(items: readonly ShowcaseItem[]) {
  return Array.from(new Set(items.flatMap((item) => getItemTags(item)))).sort((first, second) =>
    first.localeCompare(second),
  );
}

export function getItemTags(item: ShowcaseItem) {
  return Array.from(new Set([...(item.tags ?? []), item.kind, item.status].filter(Boolean)));
}

export function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase();
}
