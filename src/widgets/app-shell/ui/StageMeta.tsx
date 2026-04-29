import { Chip } from "@heroui/react";

import { siteConfig } from "@/app/config/site";
import type { RegisteredPage } from "@/app/routing/page-registry";

type StageMetaProps = {
  page: RegisteredPage;
};

export function StageMeta({ page }: StageMetaProps) {
  return (
    <header className="stage-meta">
      <Chip className="stage-chip" variant="bordered">
        {page.label}
      </Chip>
      <time>{siteConfig.dateLabel}</time>
    </header>
  );
}
