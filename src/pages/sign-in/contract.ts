import { routePaths } from "@/app/routing/route-paths";
import type { PageContract } from "@/shared/contracts/page";

export const signInPage = {
  id: "sign-in",
  path: routePaths.signIn,
  label: "Sign in",
  title: "Sign in or sign up",
  description: "Authenticate with Google or email to unlock uploads, favorites, and repositories.",
  status: "implemented",
  ownerLayer: "pages",
} satisfies PageContract;
