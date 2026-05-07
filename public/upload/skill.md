# MuseHub Community Showcase Upload Skill

Interface name: `musehub.communityShowcase.upload.v1`

Use this skill when a user asks an agent to upload a showcase asset into MuseHub Community. The app is static frontend only, so an upload means preparing repository files and opening a GitHub pull request. Do not claim that Vite can persist files at runtime.

## Upstream Repository

Open every showcase pull request against the canonical MuseHub repository.

- **Repository:** <https://github.com/fmw666/musehub>
- **Default branch:** `main`
- **Showcase directory root:** `public/community-showcases/<kebab-case-id>/`
- **Downloadable ZIP root (optional):** `public/community-zips/<kebab-case-id>.zip`
- **Showcase entry registry:** `src/entities/showcase/model/showcase-items.ts`
- **Issue tracker:** <https://github.com/fmw666/musehub/issues>

If the agent has direct push access to the canonical repository, it may push the feature branch (`cursor/...` or `showcase/...`) to `origin` and open the pull request from `<branch>` against `main`.

If the agent does not have direct push access:

1. Fork <https://github.com/fmw666/musehub> on GitHub under the agent's or user's account.
2. Push the feature branch to the fork (e.g. `git push -u <fork-remote> showcase/<kebab-case-id>`).
3. Open the pull request on github.com from `<your-username>:showcase/<kebab-case-id>` into `fmw666/musehub:main`.

Either way, the PR target is always `fmw666/musehub` on the `main` branch.

## Required Agent Capabilities

- Read remote or local source material requested by the user.
- Write files in the repository workspace.
- Run shell commands:
  - `npm run validate:showcases`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Use git to create a branch, commit files, and create a pull request.

## Target Directory

Create one directory per showcase:

```text
public/community-showcases/<kebab-case-id>/
```

The directory must contain at least these two files:

```text
index.html
metadata.json
```

It must also contain at least one stylesheet (`*.css`) and at least one script (`*.js` or `*.mjs`).

A showcase directory has the following constraints:

- Up to 10 files per showcase, each at most 5 MB.
- Allowed file extensions: `.html`, `.css`, `.js`, `.mjs`, `.json` (the showcase code), plus `.mp4`, `.webm` (video assets) and `.png`, `.webp`, `.avif`, `.svg`, `.jpg`/`.jpeg` (image assets).
- All files must sit directly in the showcase directory; nested folders are not allowed.
- `index.html` must reference siblings only via relative `"./<name>"` paths.

### Layout examples

The simplest valid layout is still:

```text
index.html
styles.css
script.js
metadata.json
```

A multi-file layout is equally valid:

```text
index.html
metadata.json
theme.css
layout.css
vendor.js
app.js
```

A layout that includes media (video and image assets):

```text
index.html
metadata.json
style.css
hero.js
shaders.js
app.js
vendor.three.js
video.mp4
video-mask.avif
```

## HTML Shell

`index.html` must load only local files via relative `./<filename>` references. Each `<link rel="stylesheet">`, `<script src>`, `<img src>`, `<video src>`, and `<source src>` reference must resolve to an actual sibling file in the showcase directory. There is no upper limit on the number of stylesheet links, script tags, or media tags beyond the overall 10-file directory cap.

Minimal single-file example:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'"
    />
    <title>Showcase title</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="./script.js"></script>
  </body>
</html>
```

Multi-file example (any number of CSS/JS siblings, single `index.html` entry):

```html
<link rel="stylesheet" href="./theme.css" />
<link rel="stylesheet" href="./layout.css" />
...
<script src="./vendor.js"></script>
<script src="./app.js"></script>
```

Media example (use sibling sources only; remote URLs are rejected):

```html
<video controls preload="metadata" poster="./video-mask.avif">
  <source src="./video.mp4" type="video/mp4" />
</video>

<img src="./hero.png" alt="Hero illustration" />
```

The CSP template above already allows same-origin video and image playback through the `default-src 'self'` and `img-src 'self' data:` directives, so no extra directive is required when adding media assets.

No inline scripts, inline styles, event handler attributes, remote URLs, forms, iframes, objects, embeds, or base tags are allowed. SVG files must not contain `<script>`, inline event handlers, `<foreignObject>`, or scriptable URLs.

## Metadata Schema

`metadata.json` must use this shape. `environment`, `assets`, and `downloads` are optional but recommended; `files` must enumerate `index.html` plus every shipped CSS/JS file.

```json
{
  "id": "kebab-case-id",
  "title": "Human readable title",
  "tags": ["agent", "ui", "demo"],
  "sourceUrl": "https://example.com/source-or-safe/local/path",
  "sourcePlatform": "github",
  "originalFile": "source/original/path-or-url",
  "assetPath": "/community-showcases/kebab-case-id/index.html",
  "importedAt": "YYYY-MM-DD",
  "environment": "vanilla",
  "assets": {
    "html": "index.html",
    "styles": ["style.css"],
    "scripts": ["hero.js", "shaders.js", "app.js", "vendor.three.js"],
    "media": ["video.mp4", "video-mask.avif"]
  },
  "downloads": [
    {
      "kind": "vanilla",
      "label": "Vanilla static (zip)",
      "url": "/community-zips/kebab-case-id.zip",
      "description": "Self-contained static HTML bundle."
    }
  ],
  "files": {
    "index.html": { "sha256": "<64 lowercase hex chars>", "bytes": 0 },
    "style.css": { "sha256": "<64 lowercase hex chars>", "bytes": 0 },
    "hero.js": { "sha256": "<64 lowercase hex chars>", "bytes": 0 },
    "shaders.js": { "sha256": "<64 lowercase hex chars>", "bytes": 0 },
    "app.js": { "sha256": "<64 lowercase hex chars>", "bytes": 0 },
    "vendor.three.js": { "sha256": "<64 lowercase hex chars>", "bytes": 0 },
    "video.mp4": { "sha256": "<64 lowercase hex chars>", "bytes": 0 },
    "video-mask.avif": { "sha256": "<64 lowercase hex chars>", "bytes": 0 }
  }
}
```

Field rules:

- `environment`: optional, one of `vanilla`, `react`, `vue`, `svelte`, `solid`, `angular`. Drives the `Copy prompt` text and the environment chip on the gallery card. Defaults to `vanilla` for the prompt builder when omitted.
- `assets`: optional. When present, `html` must equal `"index.html"`, and `styles` / `scripts` must list every shipped stylesheet and script exactly once. When the directory ships any media file (video or image), `assets.media` must list every media file exactly once; when no media is shipped, `media` may be omitted or set to `[]`.
- `downloads`: optional, non-empty array when provided. Each entry must have a unique `kind`, a human-readable `label`, and a `url` of the form `/community-zips/<id>.zip` (same-origin only). When two or more entries are present, the gallery card surfaces a download menu so the visitor can pick the desired bundle.
- `files`: must contain a sha256 + bytes record for `index.html` and for every other file shipped in the directory (CSS, JS, media). Files must use one of the allowed extensions listed above.

Compute SHA-256 and byte length from the final file contents.

## Security Rules

- JavaScript must not use `eval`, `new Function`, `document.write`, string-based timers, remote dynamic imports, network APIs, persistent browser storage, or cookies.
- CSS must not use remote imports, `javascript:` URLs, CSS expressions, XBL bindings, or legacy behavior bindings.
- HTML must only reference siblings via relative `./<filename>` paths. No remote URLs.
- Each `<link rel="stylesheet">`, `<script src>`, `<img src>`, `<video src>`, and `<source src>` must point to a file that actually exists in the showcase directory.
- Video files must be `.mp4` or `.webm` only. Image files must be `.png`, `.webp`, `.avif`, `.svg`, `.jpg`, or `.jpeg` only.
- SVG files must not contain `<script>`, inline event handlers, `<foreignObject>`, or scriptable URLs.
- The directory must contain at most 10 files total, and no single file may exceed 5 MB.
- The generated showcase must pass `npm run validate:showcases`.

## Pull Request Flow

1. Make sure the local repository points at the canonical remote. If the agent is starting from scratch, clone it:

   ```bash
   git clone https://github.com/fmw666/musehub.git
   cd musehub
   ```

   If the agent already has a workspace with a different `origin`, add the canonical repo as a second remote (for example `upstream`) and use that for the push.

2. Create a feature branch, for example:

   ```bash
   git checkout -b showcase/<kebab-case-id>
   ```

3. Add the showcase directory under `public/community-showcases/<kebab-case-id>/` and update `src/entities/showcase/model/showcase-items.ts` so Community can list it. Mirror any `environment`, `assets`, and `downloads` fields from `metadata.json` on the showcase entry so the gallery card surfaces them. If the showcase ships a downloadable ZIP, place it at `public/community-zips/<kebab-case-id>.zip` and reference that path from `downloads[].url`.

4. Run all quality gates locally:

   ```bash
   npm run validate:showcases
   npm run lint
   npm run test
   npm run build
   ```

5. Commit the files with a descriptive message and push the branch to GitHub:
   - With direct write access: `git push -u origin showcase/<kebab-case-id>` (against `https://github.com/fmw666/musehub`).
   - Without direct write access: push to your fork instead, then open the PR from your fork into `fmw666/musehub:main`.

6. Open the pull request at <https://github.com/fmw666/musehub/compare/main...showcase/<kebab-case-id>?expand=1> (substitute the fork owner if you pushed to a fork) targeting the `main` branch.

Suggested PR title:

```text
Add <title> community showcase
```
