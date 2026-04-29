import { Card, Chip } from "@heroui/react";

import type { PageContract } from "@/shared/contracts/page";

type PagePlaceholderProps = {
  page: PageContract;
};

export function PagePlaceholder({ page }: PagePlaceholderProps) {
  return (
    <section className="planned-stage" aria-label={`${page.title} page placeholder`}>
      <Card className="planned-card">
        <Card.Content className="planned-card-body">
          <Chip className="stage-chip planned-chip" variant="bordered">
            {page.status}
          </Chip>
          <p className="planned-eyebrow">{page.path}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <span>Navigation is ready. Page implementation can be added here later.</span>
        </Card.Content>
      </Card>
    </section>
  );
}
