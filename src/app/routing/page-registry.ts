import { communityPage } from "@/pages/community/contract";
import { favoritesPage } from "@/pages/favorites/contract";
import { homePage } from "@/pages/home/contract";
import { repositoriesPage } from "@/pages/repositories/contract";
import { signInPage } from "@/pages/sign-in/contract";
import { uploadPage } from "@/pages/upload/contract";

export const pageRegistry = [
  homePage,
  communityPage,
  favoritesPage,
  repositoriesPage,
  uploadPage,
  signInPage,
] as const;

export type RegisteredPage = (typeof pageRegistry)[number];
export type RegisteredPageId = RegisteredPage["id"];

export const defaultPage = communityPage;

export function getPageByPath(pathname: string): RegisteredPage {
  return pageRegistry.find((page) => page.path === pathname) ?? defaultPage;
}
