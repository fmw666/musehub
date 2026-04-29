import { routePaths } from "@/app/routing/route-paths";
import type { PageContract } from "@/shared/contracts/page";

export const repositoriesPage = {
  id: "repositories",
  path: routePaths.repositories,
  label: "Repositories",
  title: "Repositories",
  description:
    "Repository inventory for source links, generated assets, imports, and project associations.",
  status: "planned",
  ownerLayer: "pages",
} satisfies PageContract;
