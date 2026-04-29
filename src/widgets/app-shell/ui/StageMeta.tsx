import { Chip } from "@heroui/react";

import { siteConfig } from "@/app/config/site";

export function StageMeta() {
  return (
    <header className="stage-meta">
      <Chip className="stage-chip" variant="bordered">
        {siteConfig.section}
      </Chip>
      <time>{siteConfig.dateLabel}</time>
    </header>
  );
}
