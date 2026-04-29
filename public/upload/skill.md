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

The directory must contain exactly these files:

```text
index.html
styles.css
script.js
metadata.json
```

Do not add nested folders or extra files.

## HTML Shell

`index.html` must load only local files:

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

No inline scripts, inline styles, event handler attributes, remote URLs, forms, iframes, objects, embeds, or base tags are allowed.

## Metadata Schema

`metadata.json` must use this shape:

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
  "files": {
    "index.html": {
      "sha256": "<64 lowercase hex chars>",
      "bytes": 0
    },
    "styles.css": {
      "sha256": "<64 lowercase hex chars>",
      "bytes": 0
    },
    "script.js": {
      "sha256": "<64 lowercase hex chars>",
      "bytes": 0
    }
  }
}
```

Compute SHA-256 and byte length from the final file contents.

## Security Rules

- JavaScript must not use `eval`, `new Function`, `document.write`, string-based timers, remote dynamic imports, network APIs, persistent browser storage, or cookies.
- CSS must not use remote imports, `javascript:` URLs, CSS expressions, XBL bindings, or legacy behavior bindings.
- HTML must only reference `./styles.css` and `./script.js`.
- The generated showcase must pass `npm run validate:showcases`.

## Pull Request Flow

1. Create a branch, for example `showcase/<kebab-case-id>`.
2. Add the showcase directory and update `src/entities/showcase/model/showcase-items.ts` so Community can list it.
3. Run `npm run validate:showcases`, `npm run lint`, `npm run test`, and `npm run build`.
4. Commit the files and open a pull request.

Suggested PR title:

```text
Add <title> community showcase
```
