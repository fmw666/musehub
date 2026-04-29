import { routePaths } from "@/app/routing/route-paths";
import type { PageContract } from "@/shared/contracts/page";

export const uploadPage = {
  id: "upload",
  path: routePaths.upload,
  label: "Upload",
  title: "Upload",
  description:
    "Submission workspace for URLs, screenshots, repositories, prompts, and metadata enrichment.",
  status: "planned",
  ownerLayer: "pages",
} satisfies PageContract;
