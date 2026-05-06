# Documentation

This directory is the project knowledge base. Keep docs short, current, and useful for both humans and AI coding agents.

## Index

- `architecture.md`: source layers, page plan, future implementation order, and performance strategy.
- `standards.md`: component, directory, file, code, test, and documentation standards.
- `guard.md`: structural guard pattern for defending against cross-file type-resolution false positives.
- `adr/`: architectural decision records.
  - `0001-project-architecture-and-guardrails.md`: layered React architecture and HeroUI v3 mandate.
  - `0002-animate-ui-motion-only.md`: Animate UI scope limited to motion effects and animated icons.
  - `0003-multi-file-environment-aware-showcases.md`: showcases can ship many CSS/JS files, declare an environment, and offer multiple downloadable ZIP variants.

## Documentation Rules

- Update docs when changing architecture, page plans, cross-layer contracts, tooling, or quality gates.
- Prefer one focused document over scattered notes.
- Keep examples concrete and tied to this repository.
- Do not duplicate source code in docs unless the snippet explains a convention.
- Use ADRs for decisions that would be expensive to reverse later.
