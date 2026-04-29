# MuseHub Standards

## Component Standards

- Use HeroUI v3 primitives from `@heroui/react`.
- Keep behavior, accessibility, forms, overlays, menus, cards, and controls on HeroUI components.
- Use Tailwind CSS v4 and local CSS for layout, spacing, visual style, and art direction.
- Manage global color decisions through `src/styles/index.css` tokens: base palette tokens feed semantic tokens, and semantic tokens feed component-specific tokens.
- Prefer typed config and data-driven rendering over hard-coded repeated UI.
- Do not add another UI component library unless explicitly approved.

## Directory Standards

- `src/app`: app assembly, navigation, route contracts, global config.
- `src/pages/<page>`: route-level page contract and future page implementation.
- `src/widgets/<widget>/ui`: large composed screen regions.
- `src/features/<feature>/ui`: user-facing workflows and interactions.
- `src/entities/<entity>/model`: stable domain types and entity contracts.
- `src/shared/ui`: reusable UI helpers and small primitives.
- `src/shared/contracts`: reusable cross-domain contracts.
- `src/styles`: global styles, HeroUI imports, tokens, media queries.

Do not create generic `components`, `utils`, or `helpers` folders when an existing layer can express ownership.

## File Standards

- React component files use `PascalCase.tsx`.
- Non-component modules use `kebab-case.ts`.
- Domain type files use `types.ts`.
- Page metadata files use `contract.ts`.
- Tests live next to the unit under test as `*.test.ts` or `*.test.tsx`.
- Use `@/` imports across layers. Use relative imports only within the same small module folder.

## File Header Policy

Do not add boilerplate file headers to every source file. They create noise and make AI-driven diffs harder to review.

Use a short top-of-file comment only when one of these applies:

- The file is generated or should not be edited manually.
- The file defines a public cross-layer contract with non-obvious constraints.
- The file contains temporary migration code with a planned removal condition.
- The file wraps an external API or browser behavior that needs context.

Good header:

```ts
// Generated from design tokens. Do not edit directly.
```

Avoid headers that restate the filename or obvious purpose.

## Code Standards

- Keep TypeScript strict.
- Avoid `any`; prefer explicit domain types or `unknown` with narrowing.
- Use `type` imports for type-only imports.
- Prefer named exports. Default exports are allowed for app or route entry modules.
- Keep components pure and data-driven.
- Use `readonly` arrays and `as const` for static config.
- Add dependencies only when the existing stack cannot reasonably solve the problem.

## Testing Standards

- Use Vitest and Testing Library.
- Prefer user-visible assertions: roles, labels, visible text, and user outcomes.
- Do not test HeroUI internals.
- Add tests for page shells, complex features, filtering/sorting logic, data transformations, and regressions.

## Documentation Standards

- `README.md` is the project entry.
- `AGENTS.md` is the AI coding agent guide.
- `docs/README.md` is the docs index.
- `docs/architecture.md` explains structure and evolution.
- `docs/standards.md` defines conventions.
- `docs/adr/` records significant decisions.

## Quality Gates

Run after meaningful changes:

```bash
npm run lint
npm run format:check
npm run test
npm run build
```
