import { Card, Chip } from "@heroui/react";

import type { PageContract } from "@/shared/contracts/page";
import { BlurFade } from "@/shared/ui/motion";

type PagePlaceholderProps = {
  page: PageContract;
};

export function PagePlaceholder({ page }: PagePlaceholderProps) {
  return (
    <section className="planned-stage" aria-label={`${page.title} page placeholder`}>
      <Card className="planned-card">
        <Card.Content className="planned-card-body">
          <BlurFade delay={0.05}>
            <Chip className="stage-chip planned-chip" variant="bordered">
              {page.status}
            </Chip>
          </BlurFade>
          <BlurFade delay={0.12}>
            <p className="planned-eyebrow">{page.path}</p>
          </BlurFade>
          <BlurFade delay={0.2}>
            <h1>{page.title}</h1>
          </BlurFade>
          <BlurFade delay={0.3}>
            <p>{page.description}</p>
          </BlurFade>
          <BlurFade delay={0.4}>
            <span>Navigation is ready. Page implementation can be added here later.</span>
          </BlurFade>
        </Card.Content>
      </Card>
    </section>
  );
}
