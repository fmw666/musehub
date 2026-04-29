import { routePaths } from "@/app/routing/route-paths";
import type { PageContract } from "@/shared/contracts/page";

export const communityPage = {
  id: "community",
  path: routePaths.community,
  label: "Community",
  title: "Community",
  description:
    "Variant-style content discovery page with high-density cards, source metadata, filters, and list exploration.",
  status: "scaffolded",
  ownerLayer: "pages",
} satisfies PageContract;
