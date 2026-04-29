import { routePaths } from "@/app/routing/route-paths";
import type { PageContract } from "@/shared/contracts/page";

export const homePage = {
  id: "home",
  path: routePaths.home,
  label: "Home",
  title: "MuseHub",
  description:
    "Product landing page for positioning, featured content, and primary calls to action.",
  status: "planned",
  ownerLayer: "pages",
} satisfies PageContract;
