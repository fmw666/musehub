import { Button, Form, Input, Kbd } from "@heroui/react";

import { siteConfig } from "@/app/config/site";

const composerActions = ["New", "URL", "Repo"] as const;

export function ReferenceComposer() {
  return (
    <Form className="floating-composer" aria-label="Collect a new UI reference">
      <Input
        classNames={{
          inputWrapper: "composer-input",
          input: "placeholder:text-white/38 text-white",
        }}
        placeholder={siteConfig.composerPlaceholder}
      />

      <div className="composer-tools" aria-hidden="true">
        {composerActions.map((action) => (
          <Kbd key={action}>{action}</Kbd>
        ))}
        <Button className="composer-run" size="sm" type="submit">
          Run
        </Button>
      </div>
    </Form>
  );
}
