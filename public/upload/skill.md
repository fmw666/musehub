# MuseHub Community Showcase Upload Skill

Interface name: `musehub.communityShowcase.upload.v1`

Use this skill when a user asks an agent to upload a showcase asset into MuseHub Community. The app is static frontend only, so an upload means preparing repository files and opening a GitHub pull request. Do not claim that Vite can persist files at runtime.

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

It must also contain at least one stylesheet (`*.css`) and at least one script (`*.js` or `*.mjs`). Beyond that, you may ship any combination of additional `.css`, `.js`, `.mjs`, `.mp4`, and `.webm` siblings. Nested folders and any other file extensions are not allowed.

### Limits

- **Total file count:** at most **10** files per showcase directory, counting `index.html`, `metadata.json`, and every shipped asset.
- **Per-file size:** every file must be **at most 5 MiB** (5 × 1024 × 1024 bytes). The cap applies uniformly to `index.html`, `metadata.json`, every CSS/JS file, and every video file. If a video is larger, re-encode or trim it before uploading.

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

A layout that includes one or more videos:

```text
index.html
metadata.json
styles.css
script.js
hero.mp4
loop.webm
```

## HTML Shell

`index.html` must load only local files via relative `./<filename>` references. Each `<link rel="stylesheet">`, `<script src>`, `<video src>`, and `<source src>` reference must resolve to an actual sibling file in the showcase directory. There is no upper limit on the number of stylesheet links or script tags beyond the overall 10-file directory cap.

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

Video example (use a `<video>` element with sibling sources only; remote URLs are rejected):

```html
<video controls preload="metadata" poster="">
  <source src="./hero.mp4" type="video/mp4" />
  <source src="./hero.webm" type="video/webm" />
</video>
```

If your showcase ships any video file, the CSP meta tag must also allow it. Add `media-src 'self'` to the directive list:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; media-src 'self'; font-src 'self' data:;
connect-src 'none'; object-src 'none'; base-uri 'none';
form-action 'none'; frame-ancestors 'self'
```

No inline scripts, inline styles, event handler attributes, remote URLs, forms, iframes, objects, embeds, or base tags are allowed.

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
    "styles": ["styles.css"],
    "scripts": ["script.js"],
    "media": []
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
    "styles.css": { "sha256": "<64 lowercase hex chars>", "bytes": 0 },
    "script.js": { "sha256": "<64 lowercase hex chars>", "bytes": 0 }
  }
}
```

Field rules:

- `environment`: optional, one of `vanilla`, `react`, `vue`, `svelte`, `solid`, `angular`. Drives the `Copy prompt` text and the environment chip on the gallery card. Defaults to `vanilla` for the prompt builder when omitted.
- `assets`: optional. When present, `html` must equal `"index.html"`, and `styles` / `scripts` must list every shipped stylesheet and script exactly once. When the directory ships any `.mp4` / `.webm` file, `assets.media` must list every video file exactly once; if no video is shipped, `media` may be omitted or set to `[]`.
- `downloads`: optional, non-empty array when provided. Each entry must have a unique `kind`, a human-readable `label`, and a `url` of the form `/community-zips/<id>.zip` (same-origin only). When two or more entries are present, the gallery card surfaces a download menu so the visitor can pick the desired bundle.
- `files`: must contain a sha256 + bytes record for `index.html` and for every CSS / JS / video file present in the directory.

Compute SHA-256 and byte length from the final file contents.

## Security Rules

- JavaScript must not use `eval`, `new Function`, `document.write`, string-based timers, remote dynamic imports, network APIs, persistent browser storage, or cookies.
- CSS must not use remote imports, `javascript:` URLs, CSS expressions, XBL bindings, or legacy behavior bindings.
- HTML must only reference siblings via relative `./<filename>` paths. No remote URLs.
- Each `<link rel="stylesheet">`, `<script src>`, `<video src>`, and `<source src>` must point to a file that actually exists in the showcase directory.
- Video files must be `.mp4` or `.webm` only.
- The directory must contain at most 10 files total, and no single file may exceed 5 MiB.
- The generated showcase must pass `npm run validate:showcases`.

## Pull Request Flow

1. Create a branch, for example `showcase/<kebab-case-id>`.
2. Add the showcase directory and update `src/entities/showcase/model/showcase-items.ts` so Community can list it. Mirror any `environment`, `assets`, and `downloads` fields from `metadata.json` on the showcase entry so the gallery card surfaces them.
3. Run `npm run validate:showcases`, `npm run lint`, `npm run test`, and `npm run build`.
4. Commit the files and open a pull request.

Suggested PR title:

```text
Add <title> community showcase
```
