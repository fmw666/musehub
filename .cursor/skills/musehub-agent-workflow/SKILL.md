---
name: musehub-agent-workflow
description: Guides Cursor agents working in MuseHub. Use when changing architecture, pages, components, features, tests, lint rules, or project conventions in this React + HeroUI v3 codebase.
---

# MuseHub Agent Workflow

Use this skill before making non-trivial changes in MuseHub.

## Read First

- `AGENTS.md`
- `docs/README.md`
- `docs/architecture.md`
- `docs/standards.md`
- `.cursor/rules/project-architecture.mdc`
- `.cursor/rules/heroui-v3-components.mdc`
- `.cursor/rules/documentation-standards.mdc`

## Working Rules

1. Keep the layer direction intact: `app` -> `pages/widgets/features/entities/shared`.
2. Use HeroUI v3 from `@heroui/react` for component primitives.
3. Use `@/` imports across layers.
4. Add or update page contracts before implementing page behavior.
5. Keep features replaceable and data-driven.
6. Do not introduce global state or new dependencies without a clear need.
7. Update docs or ADRs when changing project conventions, architecture, or quality gates.

## Validation

After meaningful edits, run:

```bash
npm run lint
npm run format:check
npm run test
npm run build
```

If a command fails, fix the root cause before continuing.

## Testing Defaults

- Use Vitest and Testing Library.
- Assert roles, labels, visible text, and user outcomes.
- Do not test HeroUI internals.
- Add tests for new behavior, page shells, transformations, and regressions.
