# ADR 0001: Project Architecture And Guardrails

## Status

Accepted

## Context

MuseHub is intended to be extended by AI coding agents over time. The project needs stable boundaries for pages, components, domain models, tests, docs, and tool-driven validation.

## Decision

Use a layered React architecture:

- `app` for app assembly, navigation, route contracts, and global config.
- `pages` for route-level modules.
- `widgets` for large screen regions.
- `features` for user-facing workflows.
- `entities` for domain models.
- `shared` for reusable contracts and UI helpers.
- `styles` for global CSS, HeroUI imports, tokens, and responsive rules.

Use HeroUI v3 as the mandatory component primitive system. Use ESLint, Prettier, Vitest, Testing Library, Cursor rules, and project skills as quality guardrails.

Do not require boilerplate file headers in every source file. Use top-of-file comments only for generated files, public cross-layer contracts with non-obvious constraints, migration code, or external API wrappers.

## Consequences

- Future pages can be implemented independently and lazy-loaded later.
- AI agents have explicit instructions and quality gates.
- Review diffs stay cleaner because routine file headers are avoided.
- Architecture changes should be captured in future ADRs.
