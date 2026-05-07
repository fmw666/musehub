# ADR 0003: Multi-File, Environment-Aware Community Showcases

## Status

Accepted

## Context

The first iteration of community showcases hard-coded a "vanilla HTML/CSS/JS" file
trio for every entry: each showcase under `public/community-showcases/<id>/` had to
ship exactly `index.html`, `styles.css`, `script.js`, and `metadata.json`, and the
`Copy prompt` action handed the agent precisely those three URLs. The shape was
useful for proving the pipeline but is too narrow in practice:

- Real components rarely fit into a single `script.js`. A demo may need a vendor
  bundle plus its own logic, multiple stylesheets for theming, or split modules.
- Showcases come from different ecosystems (React, Vue, Svelte, Solid, Angular,
  static HTML). The agent prompt was always written as if the source was vanilla,
  so an agent would re-author a React build as raw DOM.
- A single `zipPath` per showcase forced one canonical download. There is no way
  to publish, for example, a React-bundle zip alongside a vanilla static zip.

We want the showcase contract to stay small and predictable while supporting
multi-file bundles, multiple environments, and multiple downloadable variants.

## Decision

A community showcase still has a single `index.html` entry and lives in a flat
directory under `public/community-showcases/<id>/`. Beyond that:

- Sibling stylesheet files (`*.css`), script files (`*.js` or `*.mjs`), and
  static media files are allowed alongside `index.html` and `metadata.json`.
  Static media covers both video (`*.mp4`, `*.webm`) and image (`*.png`,
  `*.webp`, `*.avif`, `*.svg`, `*.jpg`, `*.jpeg`). Nested directories remain
  disallowed.
- The directory holds at most **10 files in total** (counting `index.html`,
  `metadata.json`, and every shipped asset), and **every file must be ≤ 5 MB**.
  These caps keep showcases fast to validate, fast to download, and trivially
  servable as static content from `public/`.
- `metadata.json` may declare an explicit `assets` block with `html`, `styles`,
  `scripts`, and optional `media` lists. When present, it must enumerate every
  shipped CSS / JS / media file exactly once. The `media` list groups video
  and image siblings together because the gallery card and copy-prompt treat
  them as a single static-media surface. When omitted, the legacy convention
  (`styles.css` + `script.js`, no media) still works.
- `metadata.json` may declare an `environment` (`vanilla`, `react`, `vue`,
  `svelte`, `solid`, `angular`). The Community gallery surfaces this as a chip
  on the card and the copy-prompt builder switches its guidance accordingly.
- `metadata.json` may declare a `downloads` array. Each entry has a unique
  `kind`, a human-readable `label`, and a same-origin `/community-zips/<id>.zip`
  URL. Multiple downloads are surfaced in the card as a HeroUI dropdown menu;
  one or zero downloads collapse back to a single button. The legacy single
  `zipPath` field on `ShowcaseItem` continues to work as a fallback.
- The validator (`scripts/validate-community-showcases.mjs`) enforces this
  schema, requires that every `<link rel="stylesheet">`, `<script src>`,
  `<img src>`, `<video src>`, and `<source src>` in `index.html` resolves to
  an actual sibling file via a relative `./<name>` reference, and rejects
  unexpected file types, nested directories, more than 10 files per showcase,
  or any single file larger than 5 MB. The HTML / CSS / JS content blocklists
  are unchanged. Raster video and image files are not content-scanned (binary
  formats are inert), but every shipped `*.svg` is content-scanned for
  `<script>`, inline event handlers, `<foreignObject>`, scriptable URLs, and
  remote URLs because SVG is XML and can host scripts when navigated to or
  embedded via `<object>`.
- The CSP meta tag in `index.html` is unchanged. Same-origin video and image
  playback is already covered by `default-src 'self'` (for `<video>` /
  `<source>`) and `img-src 'self' data:` (for `<img>`); no additional
  directive is needed when a showcase ships media.

## Consequences

- Showcases can ship realistic multi-file bundles — including short video
  demos — without per-showcase code changes; only metadata grows.
- The agent handoff prompt produced by `Copy prompt` adapts its language and
  asset URL list to whichever environment the showcase declares, so an agent
  reading a React showcase is told it is reading a React bundle and is given
  every relevant CSS / JS / media URL.
- The Community gallery card supports multiple ZIP variants per showcase; the
  user can pick which bundle to download.
- The validator and showcase entries share a single source of truth for asset
  integrity (sha256 + bytes per file) regardless of how many CSS/JS files the
  showcase ships.
