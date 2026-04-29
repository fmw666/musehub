import { routePaths } from "@/app/routing/route-paths";

export const primaryNavigation = [
  { id: "home", label: "Home", path: routePaths.home, icon: "orbit" },
  { id: "community", label: "Community", path: routePaths.community, icon: "spark" },
  { id: "favorites", label: "Favorites", path: routePaths.favorites, icon: "square" },
  { id: "repositories", label: "Repositories", path: routePaths.repositories, icon: "dots" },
  { id: "upload", label: "Upload", path: routePaths.upload, icon: "spark" },
] as const;

export type PrimaryNavigationItem = (typeof primaryNavigation)[number];
