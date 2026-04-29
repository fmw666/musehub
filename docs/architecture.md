# MuseHub Architecture

MuseHub is prepared as a scalable React + Vite + HeroUI v3 application.

## Page Map

| Page         | Path            | Current status | Purpose                                                    |
| ------------ | --------------- | -------------- | ---------------------------------------------------------- |
| Home         | `/`             | planned        | Landing page, value proposition, featured references       |
| Community    | `/community`    | scaffolded     | Variant-style content discovery and dense list exploration |
| Favorites    | `/favorites`    | planned        | Saved references and collections                           |
| Repositories | `/repositories` | planned        | Source repositories and linked content                     |
| Upload       | `/upload`       | planned        | URL, image, repository, and prompt submission              |

## Source Layers

`app` owns application assembly, route contracts, navigation, and global config.

`pages` owns route-level modules. A page should compose widgets and features. It should not contain low-level UI primitives or business data models.

`widgets` owns large screen regions such as shell, side rail, hero sections, list surfaces, and dashboards.

`features` owns user interactions such as collecting references, filtering content, saving favorites, repository import, and upload flows.

`entities` owns stable domain models such as content, favorites, repositories, uploads, and showcase records.

`shared` owns reusable contracts, UI helpers, utility functions, and low-level primitives.

`styles` owns global CSS, HeroUI style imports, theme tokens, media queries, and cross-page visual primitives.

## Future Implementation Order

1. Add real routing only when at least two pages have implementations.
2. Move the existing gallery experience into the Community page module.
3. Build Home as a separate route with marketing widgets and featured content.
4. Add Favorites using `FavoriteItem` and `ContentItem` contracts.
5. Add Repositories using `RepositoryRecord` and source linking.
6. Add Upload around `UploadDraft`, validation, and metadata enrichment.

## Variant-Style Direction

Use Variant-style product references as inspiration for density, rhythm, metadata, and discovery UX. Do not copy proprietary assets, exact text, or private implementation details. The MuseHub implementation should be original and data-driven.

## Performance Strategy

- Keep each page import boundary clean for future `React.lazy`.
- Avoid putting page-specific state into global modules.
- Make all list surfaces data-driven and ready for virtualization.
- Prefer CSS containment and `content-visibility` for visual grids.
- Use HeroUI accessible primitives instead of custom behavior.

## Related Standards

- Project conventions: `docs/standards.md`
- AI agent workflow: `AGENTS.md`
- Decision records: `docs/adr/`
