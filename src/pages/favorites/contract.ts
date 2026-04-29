import { routePaths } from "@/app/routing/route-paths";
import type { PageContract } from "@/shared/contracts/page";

export const favoritesPage = {
  id: "favorites",
  path: routePaths.favorites,
  label: "Favorites",
  title: "Favorites",
  description:
    "Saved content library for collections, pinning, later review, and reusable references.",
  status: "planned",
  ownerLayer: "pages",
} satisfies PageContract;
