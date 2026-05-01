# MuseHub Agent Guide

This project is designed to be maintained by AI coding agents.

## Product Surface

Planned pages:

- Home: product landing, positioning, highlights, and calls to action.
- Community: Variant-style discovery page for dense content lists, metadata, filters, and exploration.
- Favorites: saved content, collections, pinned references, and review workflows.
- Repositories: source repository inventory, linked content, sync status, and project associations.
- Upload: submission workspace for URLs, images, repositories, prompts, and metadata enrichment.

## Architecture

Use the existing layered structure:

- `src/app`: app composition, routing contracts, navigation, global config.
- `src/pages`: route-level page contracts and future page modules.
- `src/widgets`: large page regions composed from features and entities.
- `src/features`: user actions and interaction modules.
- `src/entities`: domain models and entity-specific data contracts.
- `src/shared`: reusable UI, contracts, primitives, utilities.
- `src/styles`: global CSS, tokens, HeroUI style import, responsive rules.

Do not bypass layers for convenience. Pages compose widgets and features; features may use entities and shared modules; shared modules must not import app, pages, widgets, features, or entities.

## Documentation

Use `README.md` as the project entry, `docs/README.md` as the documentation index, `docs/architecture.md` for architecture, `docs/standards.md` for conventions, and `docs/adr/` for architectural decision records.

Do not add boilerplate file headers to every source file. Add a short top-of-file comment only for generated files, public cross-layer contracts with non-obvious constraints, temporary migration code, or external API/browser wrappers.

## UI System

HeroUI v3 is mandatory for component primitives. Import from `@heroui/react`. Keep behavior, accessibility, forms, overlays, menus, cards, and controls on HeroUI components. Use Tailwind CSS v4 and local CSS for layout and art direction.

### Motion Layer (Animate UI)

[Animate UI](https://animate-ui.com/) is allowed as a **motion layer only**, never as a component library (see `docs/adr/0002-animate-ui-motion-only.md`).

- Ported motion effects live under `src/shared/ui/motion/**`. Animated icons live under `src/shared/ui/icons/animated/**`.
- Motion atoms must wrap HeroUI components, not replace them. Do not port Animate UI's Button, Card, Input, Dialog, Tabs, Tooltip, Popover, Accordion, Dropdown, Select, Checkbox, Switch, Badge, Avatar, Skeleton, Spinner, or any other component-category asset. HeroUI covers all of these.
- The only animation runtime dependency is `motion`. Do not import it outside the two paths above; `npm run guard:design` enforces this.
- Motion atoms must honor `prefers-reduced-motion: reduce` and consume `--muse-*` tokens / `--muse-ease-*` easings.
- Each ported file needs a short top-of-file header declaring its Animate UI upstream source.

Current motion atoms exported from `src/shared/ui/motion/`:

- `BlurFade` — staggered entrance fade + slight translate + blur release for hero copy and section blocks.
- `Counter` — animated number tween for statistics and counts.
- `MotionHighlight` — measurement-driven sliding indicator that tracks a caller-supplied rect (used by the side rail's active indicator).
- `TypingText` — typewriter-style text that supports single strings or looping across an array, with a blinking caret.
- `PressPulse` — one-shot scale + opacity pulse overlay triggered by a `triggerKey` change (used for copy-success feedback).

When adding another atom, follow the checklist in `docs/adr/0002-animate-ui-motion-only.md` under "Adding a new atom".

Run `npm run guard:motion` (or `node scripts/motion-report.mjs`) to see the live atom → consumers map straight from source instead of trusting the list above. The same script enforces three ADR 0002 discipline rules (upstream attribution header, `useReducedMotion` / `prefers-reduced-motion` opt-in, adjacent unit test) and exits non-zero on violation. **It is part of `npm run ci`** (between `guard:design` and `test`) — there is no way to land a new atom that skips these checks. For reduced-motion branch testing, use `mockReducedMotion(true)` from `@/test/reduced-motion`; see `src/shared/ui/motion/TypingText.test.tsx` and `PressPulse.test.tsx` for examples.

## Routing Prep

Routes are declared in `src/app/routing/route-paths.ts`. Page metadata lives in `src/pages/*/contract.ts` and is collected by `src/app/routing/page-registry.ts`. Do not add a router library until real navigation is implemented.

## Performance Defaults

- Keep route-level code isolated so pages can be lazy-loaded later.
- Avoid global state until there is shared state across pages.
- Keep content lists data-driven and virtualizable.
- Prefer derived data and memoization at feature boundaries, not everywhere.
- Preserve `content-visibility` and reduced-motion handling in CSS.

## Agent Workflow

Before implementing a page, update its page contract status and add the smallest necessary module surface. Keep each feature independently replaceable. Run `npm run build` after structural changes.

## Quality Gates

Use these commands after meaningful edits:

```bash
npm run lint
npm run format:check
npm run test
npm run build
```

Use `npm run typecheck` for a fast TypeScript-only check. Tests use Vitest and Testing Library. Linting uses ESLint flat config with TypeScript-aware rules. Formatting uses Prettier.
