export const routePaths = {
  home: "/",
  community: "/community",
  favorites: "/favorites",
  repositories: "/repositories",
  upload: "/upload",
  signIn: "/sign-in",
} as const;

export type AppRouteId = keyof typeof routePaths;
export type AppRoutePath = (typeof routePaths)[AppRouteId];
