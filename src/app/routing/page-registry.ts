import { communityPage } from "@/pages/community/contract";
import { favoritesPage } from "@/pages/favorites/contract";
import { homePage } from "@/pages/home/contract";
import { repositoriesPage } from "@/pages/repositories/contract";
import { uploadPage } from "@/pages/upload/contract";

export const pageRegistry = [
  homePage,
  communityPage,
  favoritesPage,
  repositoriesPage,
  uploadPage,
] as const;
